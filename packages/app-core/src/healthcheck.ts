import type {Application, Request, Response} from 'express';
import {useHttpLogging} from '@gradebook/logging/lib/http.js';
import {$$loggingConfig, logger} from './app-core.js';

export function healthcheck(request: Request, response: Response) {
	response.status(200).end('Howdy!');
}

export function useHealthCheck(app: Application) {
	if (!$$loggingConfig.healthcheck) {
		throw new Error('Healthcheck is not enabled in config#logging.healthcheck');
	}

	const {path} = $$loggingConfig.healthcheck;
	app.get(path, healthcheck);
}

export function useLoggingAndHealthcheck(app: Application) {
	app.use(useHttpLogging(logger, $$loggingConfig));
	useHealthCheck(app);
}
