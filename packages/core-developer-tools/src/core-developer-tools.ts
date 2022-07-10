import type {Application} from 'express';
import {register as registerProtocolMatching} from './tools/protocol-matching.js';
import {register as registerSentry} from './tools/sentry.js';
import {register as registerAuth} from './tools/auth.js';
import {serverDependencies} from './server-dependencies.js';

if (process.env.NODE_ENV === 'production') {
	console.error('Attempted to load @gradebook/core-developer-tools in a production environment');
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
}

export async function load(serverRoot: string, app: Application) {
	await serverDependencies.init(serverRoot);
	await Promise.all([
		registerProtocolMatching(app),
		registerSentry(app),
		registerAuth(app),
	]);
}
