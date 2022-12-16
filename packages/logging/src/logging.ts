import {pid} from 'process';
import {hostname} from 'os';
import {pino, stdTimeFunctions} from 'pino';
import {getPinoTransport} from './transport.js';
import {type RawLoggingOptions, createSafeOptions} from './config.js';
import {requestSerializer, responseSerializer} from './util/serializers.js';

const redact = ['*.cookie', '*["set-cookie"]', '*.authorization'];

export async function createLogger(rawIgnitionOptions: RawLoggingOptions) {
	const options = createSafeOptions(rawIgnitionOptions);
	return pino({
		redact,
		level: options.transports.length === 0 ? 'silent' : options.level,
		timestamp: stdTimeFunctions.isoTime,
		base: {
			pid,
			hostname,
			name: options.name,
			env: options.env,
			domain: options.domain,
		},
		serializers: {
			req: requestSerializer,
			res: responseSerializer,
		},
	}, await getPinoTransport(options));
}

export {createSafeOptions as createConfig} from './config.js';
