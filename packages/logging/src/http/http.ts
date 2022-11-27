import {URL} from 'url';
import {type IncomingMessage} from 'http';
import {randomUUID} from 'crypto';
import {type Logger} from 'pino';
import {pinoHttp, type Options as HttpLoggerOptions} from 'pino-http';
import {type LoggingOptions} from '../config.js';
import {createThrottler, type Throttler} from '../util/throttle.js';

export interface HttpLoggingOptions {
	healthCheck?: boolean | {
		intervalInMinutes?: number;
		path?: string;
	};
}

export const createIgnore = (allow: Throttler, path: string) => (request: IncomingMessage) => {
	const unparsedUrl = (request as unknown as {originalUrl: string}).originalUrl ?? request.url;
	const url = new URL(unparsedUrl, 'https://smol.url');
	if (url.pathname === path) {
		return allow();
	}

	return true;
};

export const useHttpLogging = (logger: Logger, {healthcheck}: LoggingOptions) => {
	const options: HttpLoggerOptions = {
		logger,
		genReqId: () => randomUUID(),
		customSuccessMessage: () => '',
	};

	if (healthcheck) {
		options.autoLogging = {
			ignore: createIgnore(createThrottler(healthcheck.intervalInMinutes * 60_000), healthcheck.path),
		};
	}

	return pinoHttp(options);
};
