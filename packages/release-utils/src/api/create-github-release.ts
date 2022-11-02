import {fetch} from 'zx';

interface GitHubPutReleaseBody {
	tag_name: string;
	target_commitish?: string;
	name?: string;
	body?: string;
	draft?: boolean;
	prerelease?: boolean;
}

// Partial
interface GithubPutReleaseResponse {
	url: string;
	id: number;
}

export interface CreateGitHubReleaseOptions {
	token: string;
	owner: string;
	repo: string;
	referenceTag: string;
	draft?: boolean;
	name?: string;
	body?: string;
	prerelease?: boolean;
}

export default async function createGitHubReleaseFromExistingTag({
	token,
	owner,
	repo,
	referenceTag,
	draft = true,
	name,
	body: releaseBody,
	prerelease = false,
}: CreateGitHubReleaseOptions, assets: string[] = []): Promise<unknown> {
	const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
	const requestBody: GitHubPutReleaseBody = {
		tag_name: referenceTag, // eslint-disable-line camelcase
		draft,
		prerelease,
	};

	if (name !== undefined) {
		requestBody.name = name;
	}

	if (releaseBody !== undefined) {
		requestBody.body = releaseBody;
	}

	const body = await fetch(url, {
		method: 'post',
		body: JSON.stringify(requestBody),
		headers: {
			'content-type': 'application/json',
			accept: 'application/vnd.github.v3+json',
			authorization: `Bearer ${token}`,
		},
	}).then(async (response): Promise<GithubPutReleaseResponse> => response.json());

	if (assets.length === 0) {
		return body.id;
	}

	for (const asset of assets) {
		// @TODO
	}
}
