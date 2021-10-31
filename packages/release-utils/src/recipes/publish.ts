/* eslint-disable unicorn/no-process-exit */
import {getShaFromEnvironment} from '../api/get-sha-from-env.js';
import {configureForRelease} from '../api/configure-for-release.js';
import {publishPackage} from '../api/publish-package.js';

async function wrap() {
	const sha = getShaFromEnvironment();
	try {
		const packageJson = await configureForRelease(sha);
		await publishPackage(sha, packageJson);
		console.log('Recipe "publish" completed successfully');
	} catch (error) {
		console.error('Recipe "publish" failed');
		if (typeof error === 'object' && error?.constructor?.name !== 'ProcessOutput') {
			console.error(error);
		}

		process.exit(1);
	}
}

void wrap();
