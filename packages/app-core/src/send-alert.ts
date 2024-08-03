import {Socket} from 'node:net';
import {type Buffer} from 'node:buffer';
import {TransformStream} from 'node:stream/web';
import {config, logger} from './app-core.js';

export interface Alert {
	message: string;
	channel?: string;
}

let loaded = false;
let name = '';
let socketPath = '';
let sequence = 0;

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

class SocketWrapper {
	static async create(socketPath: string): Promise<SocketWrapper> {
		return new Promise((resolve, reject) => {
			const socket = new Socket();
			// TODO: set this up
			socket.connect(socketPath, () => {
				resolve(new SocketWrapper(socket));
			});
		});
	}

	private readonly _ackWatchers = new Map<number, () => void>();
	private readonly readTransformer = newLineTransformer();

	constructor(private readonly _socket: Socket) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		_socket.on('data', buffer => this.readTransformer.writable.getWriter().write(buffer));
		void this.processIncomingMessages();
	}

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	waitForAck(sequence: number, timeout: number): Promise<void> {
		return new Promise((resolve, reject) => {
			// CASE: infinite timer, we don't need to conditionally resolve
			if (timeout === 0) {
				this._ackWatchers.set(sequence, resolve);
				return;
			}

			// CASE: there is a timer, so we need to either resolve (response before timer)
			// or reject (no response, or response comes after timeout)
			const timer = setTimeout(() => {
				const shouldReject = this._ackWatchers.delete(sequence);
				if (shouldReject) {
					reject(new Error('Timeout waiting for ack'));
				}
			}, timeout);

			this._ackWatchers.set(sequence, () => {
				const shouldContinue = this._ackWatchers.delete(sequence);
				if (shouldContinue) {
					clearTimeout(timer);
					resolve();
				}
			});
		});
	}

	get write() {
		return this._socket.write;
	}

	private async processIncomingMessages() {
		for await (const message of this.readTransformer.readable) {
			this._processMessage(message);
		}
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
			logger.warn(`[app-core]: Failed parsing message from alerting socket: ${message}`);
			logger.warn(error);
			return;
		}

		switch (parsed.type) {
			case 'ack': {
				const listener = this._ackWatchers.get(parsed.sequence);
				this._ackWatchers.delete(parsed.sequence);

				if (listener) {
					listener();
				} else {
					logger.warn(`[app-core]: Received ack for unknown sequence: ${parsed.sequence}`);
				}

				break;
			}

			default: {
				logger.error(`[app-core]: Unknown message from alerting socket: ${message}`);
				break;
			}
		}
	}
}

let _socket: SocketWrapper;

export function canSendAlerts(): boolean {
	if (loaded) {
		return Boolean(name && socketPath);
	}

	const configName: unknown = config.get('alerting:name') ?? config.get('name');

	if (typeof configName === 'string') {
		name = JSON.stringify(configName);
	}

	const configSocketPath: unknown = config.get('alerting:socket');
	if (typeof configSocketPath === 'string') {
		socketPath = configSocketPath;
	}

	loaded = true;

	return Boolean(name && socketPath);
}

function assertCanSendAlerts(): void {
	if (!canSendAlerts()) {
		throw new Error('Alerting is not set up');
	}
}

function getSocket(): Promise<SocketWrapper> | SocketWrapper {
	if (_socket) {
		return _socket;
	}

	return SocketWrapper.create(socketPath);
}

export async function sendAlert(message: string, channel?: string, wait?: number): Promise<void> {
	assertCanSendAlerts();

	const socket = await getSocket();

	if (!message) {
		throw new TypeError('Message is required');
	}

	const thisSequence = sequence++;

	const messageString = message.replace('"', '\\"');
	// Name is pre-stringified
	let payload = `{"sequence":"${thisSequence}","name":${name},"message":${messageString}`;

	if (channel) {
		const channelString = channel.replace('"', '\\"');
		payload += `,"channel":${channelString}`;
	}

	if (wait) {
		payload += ',"ack":true';
	}

	socket.write(payload + '}\n', 'utf8');

	if (wait !== undefined) {
		return socket.waitForAck(thisSequence, wait);
	}
}
