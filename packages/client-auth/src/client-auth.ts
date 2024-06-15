import {Buffer} from 'buffer';
import * as path from 'path';
import {URL} from 'url';
import {setTimeout} from 'timers/promises';

interface Resolution {
	ip: string;
	port: string;
	hostname: string;
}

interface GetRequestOptions {
	includeHostInHeader?: boolean;
}

interface AuthFetchOptions {
	headers: {
		authorization: string;
		host?: string;
	};
}

type CachedToken = [number, string];

export function getSafeExpiryFromJwt(jwt: string): number | null {
	const [, payload] = jwt.split('.');
	try {
		const info = JSON.parse(Buffer.from(payload, 'base64').toString()) as {exp: number};

		if (!info.exp) {
			return null;
		}

		// 10 second early-expiry; convert s to ms
		return (info.exp - 10_000) * 1000;
	} catch {
		return null;
	}
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

export class AuthManager {
	#resolver = new Map<string, Resolution>();
	#serviceLocation = new Map<string, number>();
	#tokens = new Map<string, CachedToken>();
	readonly #gatewayRoot: string;
	readonly #credentials: string;

	constructor(
		accessUrl: string,
		private readonly serviceMap: string[][] = [],
		private readonly fetch = globalThis.fetch,
	) {
		const parsedUrl = new URL(accessUrl);

		if (!parsedUrl.username || !parsedUrl.password) {
			throw new Error('Missing authorization');
		}

		this.#credentials = `${parsedUrl.username}:${parsedUrl.password}`;
		parsedUrl.password = '';
		parsedUrl.username = '';

		this.#gatewayRoot = parsedUrl.href;
		if (serviceMap) {
			this.setServiceMap(serviceMap);
		}
	}

	setServiceMap(serviceMap: string[][]) {
		this.#serviceLocation.clear();
		for (const [bucketIndex, bucket] of serviceMap.entries()) {
			for (const serviceName of bucket) {
				this.#serviceLocation.set(serviceName, bucketIndex);
			}
		}
	}

	async getRequestInfo(
		serviceName: string,
		{includeHostInHeader = true}: GetRequestOptions = {},
	): Promise<[Resolution, AuthFetchOptions] | null> {
		const resolution = this.#resolver.get(serviceName) ?? await this.#fetchServiceInfo(serviceName);
		const fetchOptions = await this.#getFetchOptionsWithAuthorization(serviceName);

		if (!resolution) {
			return null;
		}

		if (includeHostInHeader) {
			fetchOptions.headers.host = resolution.hostname;
		}

		return [resolution, fetchOptions];
	}

	serviceFailedConnecting(serviceName: string) {
		this.#resolver.delete(serviceName);
	}

	async #getFetchOptionsWithAuthorization(serviceName: string, retry = 3): Promise<AuthFetchOptions> {
		if (retry === 0) {
			throw new Error('Unable to get JWT');
		}

		const existingToken = this.#tokens.get(serviceName);

		if (existingToken && existingToken[0] > Date.now()) {
			return {
				headers: {
					authorization: `Bearer ${existingToken[1]}`,
				},
			} satisfies Partial<RequestInit>;
		}

		if (!this.#serviceLocation.has(serviceName)) {
			throw new Error(`Service ${serviceName} is not included in the service map`);
		}

		const permissions = this.serviceMap[this.#serviceLocation.get(serviceName)!];
		let request: Response;

		try {
			request = await this.fetch(resolvePaths(this.#gatewayRoot, '/api/v0/token').href, {
				method: 'post',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					identifier: this.#credentials,
					permissions,
				}),
			});
		} catch {
			await setTimeout(100);
			return this.#getFetchOptionsWithAuthorization(serviceName, retry - 1);
		}

		const response = await request.json() as {token: string} | {error: string};

		if (!response || 'error' in response) {
			const cause = response ? (response as Record<string, string>).error : 'unknown error';
			throw new Error(`Failed to get JWT for ${serviceName} - ${cause}`);
		}

		const expiry = getSafeExpiryFromJwt(response.token);

		if (!expiry) {
			throw new Error('Failed to parse expiry in JWT');
		}

		const cachedToken: CachedToken = [expiry, response.token];
		for (const serviceName of permissions) {
			this.#tokens.set(serviceName, cachedToken);
		}

		return {
			headers: {
				authorization: `Bearer ${response.token}`,
			},
		} satisfies Partial<RequestInit>;
	}

	async #fetchServiceInfo(serviceName: string): Promise<Readonly<Resolution> | null> {
		const url = resolvePaths(this.#gatewayRoot, `/api/v0/resolve/${serviceName}`);
		const options = await this.#getFetchOptionsWithAuthorization(serviceName);
		const response = await this.fetch(url.href, options);

		if (!response.ok) {
			await response.text();
			return null;
		}

		const body = await response.json() as {error: string} | Resolution;

		if ('error' in body) {
			return null;
		}

		this.#resolver.set(serviceName, body);
		return body;
	}
}
