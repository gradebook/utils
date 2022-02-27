import {URL, URLSearchParams} from 'url';
import {Request} from 'express';

export function getRequestUrl(request: Request) {
	return new URL(request.originalUrl, request.headers.referer);
}

export function getQuery(query: URLSearchParams): string {
	const stringifiedQuery = query.toString();
	return stringifiedQuery ? `?${stringifiedQuery}` : stringifiedQuery;
}
