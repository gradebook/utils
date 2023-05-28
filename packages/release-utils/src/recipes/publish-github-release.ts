import {exit} from 'process';
import * as envCore from '../api/get-var-from-env.js';
import {configureForRelease} from '../api/configure-for-release.js';
import {publishPossibleGitHubRelease} from '../api/publish-github-release.js';
import {resolveTagName} from '../api/publish-package.js';

async function wrap() {
	const sha = envCore.getKeyFromEnvironment(envCore.shaInGitHubActions);
	const repository = envCore.getKeyFromEnvironment(envCore.repositoryInGitHubActions);
	const token = envCore.getKeyFromEnvironment(envCore.tokenInGitHubActions);

	try {
		const packageJson = await configureForRelease(sha);
		const tagName = await resolveTagName(sha, packageJson);
		if (!tagName) {
			throw new Error('Unable to find tag name');
		}

		await publishPossibleGitHubRelease({tagName, repository, token});
		console.log('Recipe "publish-github-release" completed successfully');
	} catch (error) {
		console.error('Recipe "publish-github-release" failed');
		if (typeof error === 'object' && error?.constructor?.name !== 'ProcessOutput') {
			console.error(error);
		}

		exit(1);
	}
}

void wrap();
