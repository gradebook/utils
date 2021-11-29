import {readFile} from 'fs/promises';
import path from 'path';
import {fetch as fetch_} from 'zx';
import type {RequestInit} from 'node-fetch';
import 'urijs/src/URITemplate.js'; // eslint-disable-line import/no-unassigned-import
import URI from 'urijs';

let fetch = fetch_;

export function __testDependencyInjector(fetchOverride?: typeof fetch_) {
	fetch = fetchOverride ?? fetch_;
}

export type Asset = string | [path: string, name: string];

export interface GitHubReleaseTagResponse {
	upload_url: string;
}

export interface GitHubReleaseUploadParameters {
	token: string;
	ownerAndRepository: string;
	tagName: string;
}

export async function makeGitHubRequest<ResponseType>(url: string, options: RequestInit, authToken: string) {
	// @ts-expect-error types vs interfaces
	const headers: Record<string, string> = options.headers ?? {};
	headers['content-type'] = 'application/json';
	headers.accept = 'application/vnd.github.v3+json';
	headers.authorization = `token ${authToken}`;

	options.headers = headers;

	return fetch(url, options).then(async (response): Promise<ResponseType> => response.json());
}

export async function uploadGitHubReleaseAsset(url: string, asset: Asset, authToken: string): Promise<boolean> {
	let assetName: string;
	let assetPath: string;

	if (typeof asset === 'string') {
		assetName = path.basename(asset);
		assetPath = asset;
	} else {
		[assetPath, assetName] = asset;
	}

	try {
		const buffer = await readFile(assetPath);
		// `expand` is available because we `import 'urijs/src/URITemplate';`
		const fullUrl = URI.expand!(url, {name: assetName}).toString();
		await makeGitHubRequest(fullUrl, {method: 'POST', body: buffer}, authToken);
		return true;
	} catch (error: unknown) {
		console.error(`Failed uploading asset: "${assetName}" (${assetPath}):`);
		console.error(error);
		return false;
	}
}

/**
 * @returns the number of assets that failed to upload
 */
export async function uploadGitHubReleaseAssets({
	token,
	tagName,
	ownerAndRepository,
}: GitHubReleaseUploadParameters, assets: Asset[] | string): Promise<boolean[]> {
	const baseUrl = `https://api.github.com/repos/${ownerAndRepository}/releases`;
	// eslint-disable-next-line camelcase
	const {upload_url} = await makeGitHubRequest<GitHubReleaseTagResponse>(`${baseUrl}/tags/${tagName}`, {}, token);

	if (typeof assets === 'string') {
		assets = [assets];
	}

	return Promise.all(assets.map(async asset => uploadGitHubReleaseAsset(upload_url, asset, token)));
}
