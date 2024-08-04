import {type Buffer} from 'node:buffer';
import {TransformStream} from 'node:stream/web';
import {Socket} from 'node:net';
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
			buffer = messages.pop() ?? '';
			for (const message of messages) {
				controller.enqueue(message);
			}
		},
	});
}

export class PersistentSocket {
	private socket!: Socket;
	private readonly messageQueue = new RingFifo<string>(255);
	private readonly _ackWatchers = new Map<number, (errored: boolean) => void>();
	private readonly readTransformer = newLineTransformer();
	private readonly readTransformerIngest = this.readTransformer.writable.getWriter();
	private socketBackoff = 0;
	private socketReady!: Promise<void>;
	private writingMessage = '';

	constructor(private readonly socketPath: string, private readonly logger: Logger) {
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

					if (this.writingMessage) {
						if (!this.messageQueue.prioritize(this.writingMessage)) {
							this.logger.warn(`[app-core]: dropped alert ${this.writingMessage}`);
						}

						this.writingMessage = '';
					}

					try {
						for (const callback of this._ackWatchers.values()) {
							callback(true);
						}

						this._ackWatchers.clear();
					} catch {}

					this.createSocket();
				});

				// eslint-disable-next-line @typescript-eslint/promise-function-async
				socket.on('data', buffer => this.readTransformerIngest.write(buffer));
			}, this.socketBackoff);
		});
	}

	private async drainOutgoingMessages(fromSuccessfulWrite = false) {
		if (fromSuccessfulWrite || this.writingMessage) {
			return;
		}

		try {
			await this.socketReady;
		} catch {
			return;
		}

		const message = this.batchMessages();
		if (!message) {
			return;
		}

		this.writingMessage = message;

		const flushed = this.socket.write(message, 'utf8');

		// eslint-disable-next-line @typescript-eslint/promise-function-async
		const callback = () => this.drainOutgoingMessages(true);

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

			message += nextMessage + '\n';
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

			if (!parsed || typeof parsed !== 'object') {
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
