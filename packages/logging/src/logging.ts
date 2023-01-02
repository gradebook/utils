import {pid} from 'process';
import {hostname} from 'os';
import {type LoggerOptions, pino, stdTimeFunctions} from 'pino';
import {getPinoTransport} from './transport.js';
import {type RawLoggingOptions, createSafeOptions} from './config.js';
import {domainSymbol, errorSerializer, requestSerializer, responseSerializer} from './util/serializers.js';

export async function createLogger(rawIgnitionOptions: RawLoggingOptions) {
	const options = createSafeOptions(rawIgnitionOptions);
	return pino({
		level: options.transports.length === 0 ? 'silent' : options.level,
		timestamp: stdTimeFunctions.isoTime,
		base: {
			pid,
			hostname: hostname(),
			name: options.name,
			env: options.env,
			domain: options.domain,
		},
		serializers: {
			[domainSymbol]: options.domain,
			err: errorSerializer,
			error: errorSerializer,
			req: requestSerializer,
			res: responseSerializer,
		},
	} as LoggerOptions, await getPinoTransport(options));
}

export {createSafeOptions as createConfig} from './config.js';
