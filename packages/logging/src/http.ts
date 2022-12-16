import {URL} from 'url';
import {type IncomingMessage} from 'http';
import {randomUUID} from 'crypto';
import {type Logger} from 'pino';
import {pinoHttp, type Options as HttpLoggerOptions} from 'pino-http';
import {type LoggingOptions} from './config.js';
import {createThrottler, type Throttler} from './util/throttle.js';
import {requestSerializer, responseSerializer} from './util/serializers.js';

export interface HttpLoggingOptions {
	healthCheck?: boolean | {
		intervalInMinutes?: number;
		path?: string;
	};
}

export const createIgnore = (allow: Throttler, path: string) => (request: IncomingMessage) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const pathname = (request as any).path ?? new URL((request as any).originalUrl ?? request.url, 'https://smol.url').pathname;

	if (pathname === path) {
		return !allow();
	}

	return false;
};

export const useHttpLogging = (logger: Logger, {healthcheck}: LoggingOptions, __testPinoHttp = pinoHttp) => {
	const options: HttpLoggerOptions = {
		logger,
		genReqId: () => randomUUID(),
		customSuccessMessage: () => '',
		wrapSerializers: false,
		serializers: {
			req: requestSerializer,
			res: responseSerializer,
		},
	};

	if (healthcheck) {
		options.autoLogging = {
			ignore: createIgnore(createThrottler(healthcheck.intervalInMinutes * 60_000), healthcheck.path),
		};
	}

	return __testPinoHttp(options);
};
