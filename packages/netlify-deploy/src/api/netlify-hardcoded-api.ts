import {ReadStream} from 'fs';
import {URL} from 'url';
import {$, fetch} from 'zx'; // eslint-disable-line import/no-extraneous-dependencies

import {NetlifySite, NetlifySiteDeploy, NetlifyCreateSiteDeployPayload, NetlifyUpdateSiteDeployPayload, NetlifyUploadFile} from './open-api.js';

let authToken: string;

type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;

type LocalInit = Omit<RequestInit, 'body'> & {
	body?: string | Record<string, unknown> | NodeJS.ReadableStream;
};

const stringifyBody = (body: LocalInit['body']) => {
	if (typeof body === 'string') {
		return body;
	}

	if (body?.constructor?.name === 'ReadStream') {
		return body as NodeJS.ReadableStream;
	}

	return JSON.stringify(body);
};

async function makeRequest(path: string, options: LocalInit = {}) {
	const url = new URL(`/api/v1/${path}`, 'https://api.netlify.com');
	const body = options.body;
	delete options.body;
	const init: RequestInit = {
		...options as Omit<RequestInit, 'body'>,
		headers: {
			'user-agent': 'netlify/js-client (custom)',
			accept: 'application/json',
			authorization: `Bearer ${authToken}`,
		},
	};

	if (body) {
		(init.headers as Record<string, string>)['content-type'] = 'application/json';
		init.body = stringifyBody(body);
	}

	const originalVerbose = $.verbose;
	$.verbose = false;
	const toReturn = fetch(url.href, init);
	$.verbose = originalVerbose;

	return toReturn.then(async response => {
		try {
			const text = await response.text();
			return JSON.parse(text) as unknown;
		} catch (error) {
			console.error({url: response.url, status: response.status});
			throw error;
		}
	});
}

export function setAuthToken(token: string) {
	authToken = token;
}

export async function cancelDeploy({deployId}: {deployId: string}) {
	return makeRequest(`/deploys/${deployId}/cancel`, {method: 'POST'}) as Promise<NetlifySiteDeploy>;
}

export const api = {
	async getSite({siteId}: {siteId: string}) {
		return makeRequest(`/sites/${siteId}`) as Promise<NetlifySite>;
	},

	async getSiteDeploy({siteId, deployId}: {siteId: string; deployId: string}) {
		return makeRequest(`/sites/${siteId}/deploys/${deployId}`) as Promise<NetlifySiteDeploy>;
	},

	async createSiteDeploy({siteId, title, body}: {siteId: string; title?: string; body: NetlifyCreateSiteDeployPayload}) {
		let path = `/sites/${siteId}/deploys`;
		if (title) {
			path += `?title=${encodeURIComponent(title)}`;
		}

		return makeRequest(path, {method: 'POST', body}) as Promise<NetlifySiteDeploy>;
	},

	async updateSiteDeploy(
		{deployId, siteId, title, body}: {deployId: string; siteId: string; title: string; body: NetlifyUpdateSiteDeployPayload},
	) {
		let path = `/sites/${siteId}/deploys/${deployId}`;
		if (title) {
			path += `?title=${encodeURIComponent(title)}`;
		}

		return makeRequest(path, {method: 'PUT', body}) as Promise<NetlifySiteDeploy>;
	},

	async uploadDeployFile({deployId, path, body}: {deployId: string; path: string; body: ReadStream}) {
		return makeRequest(`/deploys/${deployId}/files/${path}`, {method: 'PUT', body}) as Promise<NetlifyUploadFile>;
	},
};
