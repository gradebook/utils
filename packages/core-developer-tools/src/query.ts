import type {URLSearchParams} from 'url';
import {URL} from 'url';
import type {Request} from 'express';

export function getRequestUrl(request: Request) {
	return new URL(request.originalUrl, request.headers.referer ?? `${request.protocol}://${request.headers.host}`);
}

export function getQuery(query: URLSearchParams): string {
	const stringifiedQuery = query.toString();
	return stringifiedQuery ? `?${stringifiedQuery}` : stringifiedQuery;
}
