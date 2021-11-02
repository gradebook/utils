import type {Application} from 'express';
import {register as registerSentry} from './tools/sentry.js';

if (process.env.NODE_ENV === 'production') {
	console.error('Attempted to load @gradebook/core-developer-tools in a production environment');
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
}

export function load(serverRoot: string, app: Application) {
	registerSentry(app);
}
