import {Request, Response, NextFunction, RequestHandler} from 'express';

export class TrustedRequestError extends Error {
	public readonly errorType = 'PermissionError';
}

export interface TrustedRequestConfig {
	trustedIPs: string[];
	trustProxy: boolean;
}

export default (config: TrustedRequestConfig): RequestHandler => {
	const {trustedIPs: whitelist = [], trustProxy = false} = config;

	return function isTrustedRequest(req: Request, res: Response, next: NextFunction) {
		// Only allow local ips
		if (!whitelist.includes(req.ip)) {
			return next(new TrustedRequestError('You are not authorized to access this resource'));
		}

		if (!trustProxy) {
			// Production - NGINX sits in front and adds `x-real-ip` header, nginx requests should not be trusted
			// We don't want to trust the x-forwarded-for header
			if ('x-real-ip' in req.headers || 'x-forwarded-for' in req.headers) {
				return next(new TrustedRequestError('You are not authorized to access this resource'));
			}
		}

		next();
	};
};
