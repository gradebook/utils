import type {Buffer} from 'buffer';
import path from 'path';
import {readFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import type {Application, NextFunction, Request, Response} from 'express';
import {appPath} from '../_app-path.js';
import * as query from '../query.js';

const ERROR_PAGE_PATH = '/api/embed/error-page/';
const ENVELOPE_PATH = '/api/\\d+/envelope/';
const STORE_PATH = '/api/\\d+/store';

let errorPageMarkup: Buffer;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errorPageSource = path.resolve(__dirname, './sentry-error-page.js');

function hideKeys(keys: string[]) {
	return (request: Request, response: Response, next: NextFunction) => {
		const url = query.getRequestUrl(request);
		for (const key of keys) {
			url.searchParams.delete(key);
		}

		request.originalUrl = url.pathname + query.getQuery(url.searchParams);
		next();
	};
}

async function renderSentryError(request: Request, response: Response, next: NextFunction) {
	try {
		errorPageMarkup = errorPageMarkup || await readFile(errorPageSource);
		response.setHeader('content-type', 'application/javascript');
		response.send(errorPageMarkup);
	} catch (error) {
		next(error);
	}
}

export function register(app: Application) {
	const hideCommonKeys = hideKeys(['sentry_key', 'sentry_version']);
	app.get(appPath(ERROR_PAGE_PATH), hideKeys(['dsn', 'email', 'eventId']), renderSentryError);
	app.post(appPath(ENVELOPE_PATH), hideCommonKeys, (_, response) => response.status(200).end());
	app.post(appPath(STORE_PATH), hideCommonKeys, (_, response) => response.status(200).json({}));
}
