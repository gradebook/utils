import type {IncomingMessage, ServerResponse} from 'http';
import {red, yellow, cyan, green} from 'colorette'; // eslint-disable-line import/no-extraneous-dependencies

function colorizeStatus(status: number) {
	if (status >= 500) {
		return red(status);
	}

	if (status >= 400) {
		return yellow(status);
	}

	if (status >= 300) {
		return cyan(status);
	}

	if (status >= 200) {
		return green(status);
	}

	return status;
}

export function createSuccessMessage(
	request: IncomingMessage, response: ServerResponse, responseTime: number, useColors = false,
) {
	const method = request.method!.toUpperCase();
	const url = (request as unknown as {originalUrl: string}).originalUrl ?? request.url;
	let status: string | number = response.statusCode ?? (response as any).status;

	if (useColors) {
		status = colorizeStatus(status);
	}

	return `"${method} ${url}" ${status} ${responseTime}ms`;
}
