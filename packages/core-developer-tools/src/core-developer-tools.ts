import type {Application} from 'express';
import {register as registerSentry} from './tools/sentry.js';

export function load(serverRoot: string, app: Application) {
	registerSentry(app);
}
