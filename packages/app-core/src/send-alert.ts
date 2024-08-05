import {PersistentSocket} from './alerting/persistent-socket.js';
import {config, logger} from './app-core.js';

export interface Alert {
	message: string;
	channel?: string;
}

let loaded = false;
let name = '';
let socketPath = '';
let sequence = 0;

let _socket: PersistentSocket;

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

export async function sendAlert(message: string, channel?: string, wait?: number): Promise<void> {
	assertCanSendAlerts();

	_socket ??= new PersistentSocket(socketPath, logger);

	if (!message) {
		throw new TypeError('Message is required');
	}

	const thisSequence = sequence++;

	const messageString = message.replaceAll('"', '\\"');
	// Name is pre-stringified
	let payload = `{"sequence":"${thisSequence}","name":${name},"message":"${messageString}"`;

	if (channel) {
		const channelString = channel.replaceAll('"', '\\"');
		payload += `,"channel":"${channelString}"`;
	}

	let response;

	if (wait !== undefined) {
		payload += ',"ack":true';
		response = _socket.waitForAck(thisSequence, wait);
	}

	_socket.write(payload + '}\n');

	return response;
}

export const __test = {
	setSocket(socket: PersistentSocket) {
		name = JSON.stringify('test');
		socketPath = '/path/to/socket';
		loaded = true;
		_socket = socket;
	},
};
