import got from 'got';

interface GitHubPutReleaseBody {
	tag_name: string; // eslint-disable-line camelcase
	target_commitish?: string; // eslint-disable-line camelcase
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
	prerelease = false
}: CreateGitHubReleaseOptions, assets: string[] = []): Promise<unknown> {
	const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
	const json: GitHubPutReleaseBody = {
		tag_name: referenceTag, // eslint-disable-line camelcase
		draft,
		prerelease
	};

	if (name !== undefined) {
		json.name = name;
	}

	if (releaseBody !== undefined) {
		json.body = releaseBody;
	}

	const {body} = await got<GithubPutReleaseResponse>({
		url,
		method: 'post',
		json,
		headers: {
			accept: 'application/vnd.github.v3+json',
			authorization: `token ${token}`
		}
	});

	if (assets.length === 0) {
		return body.id;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const asset of assets) {
		// @TODO
	}
}
