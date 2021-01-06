import {Request, Response, NextFunction, RequestHandler} from 'express';

export class TrustedRequestError extends Error {
	public readonly errorType = 'PermissionError'; // eslint-disable-line @typescript-eslint/class-literal-property-style
}

export interface TrustedRequestConfig {
	trustedIPs: string[];
	trustProxy: boolean;
}

const allowTrustedIPs = (config: TrustedRequestConfig): RequestHandler => {
	const {trustedIPs: allowList = [], trustProxy = false} = config;

	return function isTrustedRequest(request: Request, response: Response, next: NextFunction) {
		// Only allow local ips
		if (!allowList.includes(request.ip)) {
			next(new TrustedRequestError('You are not authorized to access this resource'));
			return;
		}

		if (!trustProxy &&
			// Production - NGINX sits in front and adds `x-real-ip` header, nginx requests should not be trusted
			// We don't want to trust the x-forwarded-for header
			('x-real-ip' in request.headers || 'x-forwarded-for' in request.headers)
		) {
			next(new TrustedRequestError('You are not authorized to access this resource'));
			return;
		}

		next();
	};
};

export default allowTrustedIPs;
