import {exit} from 'process';
import * as envCore from '../api/get-var-from-env.js';
import {configureForRelease} from '../api/configure-for-release.js';
import {publishPossibleGitHubRelease} from '../api/publish-github-release.js';
import {publishPackage} from '../api/publish-package.js';

async function wrap() {
	const sha = envCore.getKeyFromEnvironment(envCore.shaInGitHubActions);
	const repository = envCore.getKeyFromEnvironment(envCore.repositoryInGitHubActions);
	const token = envCore.getKeyFromEnvironment(envCore.tokenInGitHubActions);

	try {
		const packageJson = await configureForRelease(sha);
		const tagName = await publishPackage(sha, packageJson);
		await publishPossibleGitHubRelease({tagName, repository, token});
		console.log('Recipe "publish" completed successfully');
	} catch (error) {
		console.error('Recipe "publish" failed');
		if (typeof error === 'object' && error?.constructor?.name !== 'ProcessOutput') {
			console.error(error);
		}

		exit(1);
	}
}

void wrap();
