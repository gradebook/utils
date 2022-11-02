import {
	findReleaseByTagName, type FindReleaseByTagNameOptions, makeGitHubRequest, type PartialGitHubRelease,
} from './github.js';

export interface PublishGitHubReleaseOptions {
	token: string;
	tagName: string;
	repository: string;
}

export async function publishPossibleGitHubRelease(options: FindReleaseByTagNameOptions): Promise<boolean> {
	const release = await findReleaseByTagName(options);
	const {tagName} = options;

	if (!release) {
		console.log('Unable to find GitHub Release to publish for tag "%s".', tagName);
		return false;
	}

	if (release.draft) {
		console.log('Publishing GitHub release for "%s".', tagName);

		const {draft} = await makeGitHubRequest<PartialGitHubRelease>(release.url, options.token, {
			method: 'PATCH',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({draft: false}),
		});

		return !draft;
	}

	console.log('Not publishing GitHub release for "%s" because it\'s already published.', tagName);
	return false;
}
