import {fetch as fetch_} from 'zx';
import type {RequestInit} from 'node-fetch';

let fetch = fetch_;

export function __testDependencyInjector(fetchOverride?: typeof fetch_) {
	fetch = fetchOverride ?? fetch_;
}

export interface FindReleaseByTagNameOptions {
	token: string;
	tagName: string;
	repository: string;
}

export interface PartialGitHubRelease {
	url: string;
	tag_name: string;
	draft: boolean;
	upload_url: string;
}

export async function makeGitHubRequest<ResponseType>(url: string, authToken: string, options: RequestInit = {}) {
	// @ts-expect-error types vs interfaces
	const headers: Record<string, string> = options.headers ?? {};
	headers.accept = 'application/vnd.github.v3+json';
	headers.authorization = `Bearer ${authToken}`;

	options.headers = headers;

	return fetch(url, options).then(async (response): Promise<ResponseType> => {
		if (!response.ok) {
			try {
				const failure = await response.text();
				console.error(failure);
			} catch {}

			throw new Error(`Fetch failed with status code ${response.status}`);
		}

		return response.json();
	});
}

export async function findReleaseByTagName({
	token,
	tagName,
	repository,
}: FindReleaseByTagNameOptions): Promise<PartialGitHubRelease | null> {
	const response = await makeGitHubRequest<PartialGitHubRelease[]>(
		`https://api.github.com/repos/${repository}/releases`,
		token,
	);

	for (const candidate of response) {
		if (candidate.tag_name === tagName) {
			return candidate;
		}
	}

	return null;
}
