import {type Buffer} from 'node:buffer';
import {TransformStream} from 'node:stream/web';
import {Socket as NativeSocket} from 'node:net';
import {type Logger} from 'pino'; // eslint-disable-line import/no-extraneous-dependencies
import {RingFifo} from './fifo.js';

const DEFAULT_BACKOFF_TIMEOUT = 500;
const MAX_BACKOFF_TIMEOUT = 15_000;

function newLineTransformer() {
	let buffer = '';
	return new TransformStream<Buffer, string>({
		transform(chunk, controller) {
			const message = chunk.toString('utf8');
			buffer += message;
			if (!message.includes('\n')) {
				return;
			}

			const messages = buffer.split('\n');
			buffer = messages.pop()!;
			for (const message of messages) {
				controller.enqueue(message);
			}
		},
	});
}

let Socket = NativeSocket;

export const __test = {
	setSocketImplementation(SocketImplementation: typeof Socket) {
		Socket = SocketImplementation;
	},
};

export class PersistentSocket {
	private socket!: NativeSocket;
	private readonly messageQueue: RingFifo<string>;
	private readonly _ackWatchers = new Map<number, (errored: boolean) => void>();
	private readonly readTransformer = newLineTransformer();
	private readonly readTransformerIngest = this.readTransformer.writable.getWriter();
	private socketBackoff = 0;
	private socketReady!: Promise<void>;
	private writingMessage = '';

	constructor(
		private readonly socketPath: string,
		private readonly logger: Logger,
		queuedMessageLimit = 255,
	) {
		this.messageQueue = new RingFifo(queuedMessageLimit);
		void this.processIncomingMessages();
		this.createSocket();
	}

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	waitForAck(sequence: number, timeout: number): Promise<void> {
		return new Promise((resolve, reject) => {
			// CASE: infinite timer, we don't need to conditionally resolve
			if (timeout === 0) {
				this._ackWatchers.set(sequence, () => resolve());
				return;
			}

			// CASE: there is a timer, so we need to either resolve (response before timer)
			// or reject (no response, or response comes after timeout)
			const timer = setTimeout(() => {
				this._ackWatchers.delete(sequence);
				reject(new Error('Timeout waiting for ack'));
			}, timeout);

			this._ackWatchers.set(sequence, errored => {
				clearTimeout(timer);
				if (errored) {
					reject(new Error('Socket errored'));
				} else {
					resolve();
				}
			});
		});
	}

	write(message: string) {
		if (this.messageQueue.add(message)) {
			void this.drainOutgoingMessages();
			return true;
		}

		return false;
	}

	private createSocket(): void {
		this.socket?.destroy();
		this.socket = new Socket();
		const socket = this.socket;

		this.socketReady = new Promise((resolve, reject) => {
			setTimeout(() => {
				let handled = false;
				socket.connect(this.socketPath, () => {
					this.socketBackoff = 0;
					void this.drainOutgoingMessages();
					if (!handled) {
						handled = true;
						resolve();
					}
				});

				socket.on('error', error => {
					const previousBackoff = this.socketBackoff || DEFAULT_BACKOFF_TIMEOUT;
					this.socketBackoff = Math.min(previousBackoff * 2, MAX_BACKOFF_TIMEOUT);

					if (!handled) {
						handled = true;
						reject(error);
					}

					// If we were writing a message, recover it
					if (this.writingMessage) {
						if (!this.messageQueue.prioritize(this.writingMessage)) {
							this.logger.warn(`[app-core]: dropped alert ${this.writingMessage}`);
						}

						this.writingMessage = '';
					}

					// Remove all ackWatchers
					for (const callback of this._ackWatchers.values()) {
						callback(true);
					}

					this._ackWatchers.clear();

					this.createSocket();
				});

				// eslint-disable-next-line @typescript-eslint/promise-function-async
				socket.on('data', buffer => this.readTransformerIngest.write(buffer));
			}, this.socketBackoff);
		});
	}

	private async drainOutgoingMessages() {
		// CASE: a drain is already in progress
		// CASE: there are no messages to drain
		if (this.writingMessage || this.messageQueue.count === 0) {
			return;
		}

		try {
			await this.socketReady;
		} catch {
			// If the socket fails to be created, it will be recreated, and the drain will be retried
			return;
		}

		const message = this.batchMessages();
		if (!message) {
			return;
		}

		this.writingMessage = message;

		const flushed = this.socket.write(message, 'utf8');

		const callback = () => {
			this.writingMessage = '';
			void this.drainOutgoingMessages();
		};

		if (flushed) {
			setImmediate(callback);
		} else {
			this.socket.once('drain', callback);
		}
	}

	private async processIncomingMessages() {
		for await (const message of this.readTransformer.readable) {
			this._processMessage(message);
		}
		/* c8 ignore next - the pipe will never be destroyed, so the for loop will never break */
	}

	private batchMessages(): string {
		const highWaterMark = this.socket.writableHighWaterMark * 0.9;

		// Allow a single message to be larger than the high water mark, but buffer future messages
		let message = this.messageQueue.next() ?? '';
		while (true) { // eslint-disable-line no-constant-condition
			const nextMessage = this.messageQueue.next();
			if (!nextMessage) {
				break;
			}

			// Add 1 for the newline
			if ((message.length + nextMessage.length + 1) > highWaterMark) {
				this.messageQueue.prioritize(nextMessage);
				break;
			}

			message += nextMessage;
		}

		return message;
	}

	private _processMessage(message: string): void {
		let parsed: {
			type: 'ack';
			sequence: number;
		};

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			parsed = JSON.parse(message);

			if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
				throw new TypeError('Invalid message');
			}
		} catch (error) {
			this.logger.warn(`[app-core]: Failed parsing message from alerting socket: ${message}`);
			this.logger.warn(error);
			return;
		}

		switch (parsed.type) {
			case 'ack': {
				const listener = this._ackWatchers.get(parsed.sequence);
				this._ackWatchers.delete(parsed.sequence);

				if (listener) {
					listener(false);
				} else {
					this.logger.warn(`[app-core]: Received ack for unknown sequence: ${parsed.sequence}`);
				}

				break;
			}

			default: {
				this.logger.error(`[app-core]: Unknown message from alerting socket: ${message}`);
				break;
			}
		}
	}
}