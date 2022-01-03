import {fetch} from 'zx';

export interface PublishGitHubReleaseOptions {
	token: string;
	tagName: string;
	repository: string;
}

interface PartialGitHubRelease {
	id: number;
	draft: boolean;
}

export async function publishPossibleGitHubRelease({
	token,
	tagName,
	repository,
}: PublishGitHubReleaseOptions): Promise<boolean> {
	const baseUrl = `https://api.github.com/repos/${repository}/releases`;
	const releaseInformationUrl = `${baseUrl}/tags/${encodeURIComponent(tagName)}`;

	const headers = {
		'content-type': 'application/json',
		accept: 'application/vnd.github.v3+json',
		authorization: `Bearer ${token}`,
	};

	const rawResponse = await fetch(releaseInformationUrl, {headers});

	if (rawResponse.status === 404) {
		return false;
	}

	if (!rawResponse.ok) {
		throw new Error('Unexpected response');
	}

	let {id, draft} = await rawResponse.json() as PartialGitHubRelease;

	if (draft) {
		const updateUrl = `${baseUrl}/${id}`;
		const body = JSON.stringify({draft: false});

		const finalize = await fetch(updateUrl, {headers, body});
		({draft} = await finalize.json() as PartialGitHubRelease);
		return !draft;
	}

	return false;
}
