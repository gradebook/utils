import {URL} from 'url';
import * as path from 'path';
import * as jose from 'jose';
import type {Request, Response, NextFunction} from 'express';
import {IS_403, readJwt} from './jwt-parser.js';
import {useNonce, extractHeader} from './nonce.js';

export type ServiceAuthOptions = {
	serviceName: string;
	requireNonce?: boolean;
	store?: ReturnType<typeof jose['createRemoteJWKSet']>;
	gatewayRoot?: string;
} & ({
	gatewayRoot: string;
} | {
	store: ReturnType<typeof jose['createRemoteJWKSet']>;
});

export interface RequestWithGatewayToken extends Request {
	gateway?: {
		integration: string;
	};
}

export function resolvePaths(sourceUrl: string, requestedPath: string): URL {
	const url = new URL(sourceUrl);
	const endpoint = `./${requestedPath.replace(/^(.?\/)?/, '')}`;
	url.pathname = path.resolve(url.pathname, endpoint);

	if (endpoint.endsWith('/')) {
		url.pathname += '/';
	}

	return url;
}

export function useServiceAuth(options: ServiceAuthOptions) {
	const keyStore = options.store ?? jose
		.createRemoteJWKSet(resolvePaths(options.gatewayRoot!, '.well-known/jwks.json'));

	let nonceService: ReturnType<typeof useNonce> | undefined;

	if (typeof options.requireNonce === 'undefined' || options.requireNonce) {
		nonceService = useNonce();
	}

	const {serviceName} = options;

	return async (request: RequestWithGatewayToken, response: Response, next: NextFunction) => {
		const nonce = nonceService?.assert(request, response, next);
		const authorization = extractHeader(request, 'authorization')?.split(/\s+/);

		if (
			!authorization
			|| authorization.length > 2
			|| authorization[0] !== 'Bearer'
		) {
			response.status(400).json({error: 'invalid authorization header'});
			return;
		}

		const token = await readJwt(keyStore, authorization[1], [serviceName]);

		if (typeof token === 'string') {
			const statusCode = token === IS_403 ? 403 : 401;
			response.status(statusCode).json({error: token});
			return;
		}

		nonceService?.track(nonce!);

		request.gateway = {
			integration: token.integration,
		};

		next();
	};
}
