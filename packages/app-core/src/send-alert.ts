import {Socket} from 'node:net';
import {config, logger} from './app-core.js';

export interface Alert {
	message: string;
	channel?: string;
}

let loaded = false;
let name = '';
let socketPath = '';
let sequence = 0;

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

	private _buffer = '';
	private readonly _ackWatchers = new Map<number, () => void>();

	constructor(private readonly _socket: Socket) {
		_socket.on('data', buffer => {
			const data = buffer.toString('utf8');
			this._buffer += data;
			this._maybeFlushBuffers();
		});
	}

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	waitForAck(sequence: number, timeout: number): Promise<void> {
		return new Promise((resolve, reject) => {
			if (timeout === 0) {
				this._ackWatchers.set(sequence, resolve);
				return;
			}

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

	private _maybeFlushBuffers(): void {
		const lines = this._buffer.split('\n');
		if (lines.length === 0) {
			return;
		}

		this._buffer = lines.pop() ?? '';

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line) {
				continue;
			}

			this._processMessage(line);
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
