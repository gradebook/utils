import type {OutgoingMessage} from 'http';

// eslint-disable-next-line import/no-extraneous-dependencies
import {configure as makeStringify} from 'safe-stable-stringify';

const REQUEST_PROPERTIES = new Set(['id', 'url', 'method', 'originalUrl', 'params', 'extra', 'requestId', 'userId']);
const SENSITIVE_REQUEST_PROPERTIES = new Set(['headers', 'query']);

const ERROR_STRING_PROPERTIES = new Set(['id', 'name', 'code', 'statusCode', 'level', 'message', 'stack', 'hideStack']);
const ERROR_JSON_PROPERTIES = new Set(['context', 'help', 'errorDetails']);

const SENSITIVE_KEY_REGEX = /pin|password|pass|key|authorization|bearer|cookie/i;

// Pino doesn't export a global version of this
const safeStringify = makeStringify({
	maximumDepth: 5,
	maximumBreadth: 100,
});

export const domainSymbol = Symbol('logger domain');

function isObjectLike(thing: unknown): thing is Record<any, any> {
	return Boolean(thing) && typeof thing === 'object';
}

function removeSensitiveData(object: Record<any, unknown>) {
	const response: Record<any, unknown> = {};

	for (const [key, value] of Object.entries(object)) {
		if (typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key)) {
			response[key] = '**REDACTED**';
			continue;
		}

		if (typeof value === 'object' && value) {
			response[key] = Array.isArray(value)
				? value.map(item => isObjectLike(item) ? removeSensitiveData(item) : item as unknown)
				: removeSensitiveData(value as any);
			continue;
		}

		response[key] = value;
	}

	return response;
}

export function requestSerializer(request: unknown) {
	if (!isObjectLike(request)) {
		return request;
	}

	const typeSafeRequest = request as Record<any, unknown>;
	const response: Record<string, any> = {};

	for (const safeProperty of REQUEST_PROPERTIES.values()) {
		if (safeProperty in typeSafeRequest) {
			response[safeProperty] = typeSafeRequest[safeProperty];
		}
	}

	for (const sensitiveProperty of SENSITIVE_REQUEST_PROPERTIES.values()) {
		if (sensitiveProperty in typeSafeRequest) {
			const value = typeSafeRequest[sensitiveProperty];
			response[sensitiveProperty] = isObjectLike(value) ? removeSensitiveData(value) : value;
		}
	}

	return response;
}

export function responseSerializer(response: unknown) {
	if (!isObjectLike(response)) {
		return response;
	}

	const headers = typeof response.getHeaders === 'function'
		? (response as OutgoingMessage).getHeaders()
		: response.headers as unknown;

	return {
		headers: isObjectLike(headers) ? removeSensitiveData(headers) : null,
		status: response.statusCode as unknown,
	};
}

export function errorSerializer(this: unknown, error: unknown, depth = 16): unknown {
	if (depth === 0) {
		return '[serialization recursion depth limit reached]';
	}

	if (!isObjectLike(error)) {
		return error;
	}

	if (Array.isArray(error)) {
		return error.map(single => errorSerializer(single, depth - 1));
	}

	const response: Record<any, any> = {};

	if (isObjectLike(this) && domainSymbol in this) {
		response.domain = (this as Record<typeof domainSymbol, string>)[domainSymbol] as unknown;
	}

	for (const key of ERROR_STRING_PROPERTIES) {
		if (key in error) {
			response[key] = error[key] as unknown;
		}
	}

	for (const jsonKey of ERROR_JSON_PROPERTIES) {
		if (jsonKey in error) {
			response[jsonKey] = safeStringify(error[jsonKey]);
		}
	}

	if ('errorType' in error) {
		response.name = error.errorType as unknown;
	}

	if ('cause' in error) {
		if (typeof error.cause === 'function') {
			try {
				response.cause = (error as {cause: () => unknown}).cause();
			} catch {}
		} else {
			response.cause = errorSerializer(error.cause as unknown, depth - 1);
		}
	}

	return response;
}
