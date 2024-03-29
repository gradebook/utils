import type {Request, Response, NextFunction, RequestHandler} from 'express';

export class TrustedRequestError extends Error {
	public readonly errorType = 'PermissionError'; // eslint-disable-line @typescript-eslint/class-literal-property-style
	context: string;

	constructor(message: string, requestIp: string) {
		super(message);
		this.context = `From: ${requestIp}`;
	}
}

export interface TrustedRequestConfig {
	trustedIps: string[];
	trustProxy: boolean;
	message?: string;
}

export function allowTrustedIps(config: TrustedRequestConfig): RequestHandler {
	const {trustProxy = false} = config;
	const allowList = new Set(config.trustedIps);
	const errorMessage = config.message ?? 'You are not authorized to access this resource';

	return function isTrustedRequest(request: Request, response: Response, next: NextFunction) {
		// Only allow local ips
		if (!allowList.has(request.ip)) {
			next(new TrustedRequestError(errorMessage, request.ip));
			return;
		}

		if (
			!trustProxy
			// Production - NGINX sits in front and adds `x-real-ip` header, nginx requests should not be trusted
			// We don't want to trust the x-forwarded-for header
			&& ('x-real-ip' in request.headers || 'x-forwarded-for' in request.headers)
		) {
			next(new TrustedRequestError(errorMessage, request.ip));
			return;
		}

		next();
	};
}
