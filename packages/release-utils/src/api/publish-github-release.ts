import {fetch} from 'zx';

export interface PublishGitHubReleaseOptions {
	token: string;
	tagName: string;
	repository: string;
}

interface PartialGitHubRelease {
	url: string;
	tag_name: string;
	draft: boolean;
}

export async function publishPossibleGitHubRelease({
	token,
	tagName,
	repository,
}: PublishGitHubReleaseOptions): Promise<boolean> {
	const baseUrl = `https://api.github.com/repos/${repository}/releases`;

	const headers: Record<string, string> = {
		accept: 'application/vnd.github.v3+json',
		authorization: `Bearer ${token}`,
	};

	const response = await fetch(baseUrl, {headers})
		.then(async (response): Promise<PartialGitHubRelease[]> => response.json());

	let release: PartialGitHubRelease | undefined;

	for (const releaseCandidate of response) {
		if (releaseCandidate.tag_name === tagName) {
			release = releaseCandidate;
			break;
		}
	}

	if (!release) {
		console.log('Unable to find GitHub Release to publish for tag "%s".', tagName);
		return false;
	}

	if (release.draft) {
		console.log('Publishing GitHub release for "%s".', tagName);
		headers['content-type'] = 'application/json';
		const body = JSON.stringify({draft: false});

		const finalize = await fetch(release.url, {method: 'PATCH', headers, body});
		const {draft} = await finalize.json() as PartialGitHubRelease;
		return !draft;
	}

	console.log('Not publishing GitHub release for "%s" because it\'s already published.', tagName);
	return false;
}
