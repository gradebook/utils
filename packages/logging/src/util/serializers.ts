import type {OutgoingMessage} from 'http';

const REQUEST_PROPERTIES = new Set(['id', 'url', 'method', 'originalUrl', 'params', 'extra', 'requestId', 'userId']);
const SENSITIVE_REQUEST_PROPERTIES = new Set(['headers', 'query']);

const SENSITIVE_KEY_REGEX = /pin|password|pass|key|authorization|bearer|cookie/gi;

function isObjectLike(thing: unknown): thing is Record<any, any> {
	return Boolean(thing) && typeof thing === 'object';
}

function removeSensitiveData(object: Record<any, unknown>) {
	const response: Record<any, unknown> = {};

	for (const [key, value] of Object.entries(object)) {
		if (typeof value === 'object' && value) {
			response[key] = removeSensitiveData(value as any);
			continue;
		}

		if (typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key)) {
			response[key] = '**REDACTED**';
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
			if (isObjectLike(value)) {
				response[sensitiveProperty] = removeSensitiveData(value);
			} else {
				response[sensitiveProperty] = value;
			}
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
