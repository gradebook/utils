/* eslint-disable unicorn/no-process-exit */
import {configureForRelease} from '../api/configure-for-release.js';
import {publishPackage} from '../api/publish-package.js';

const sha = process.env.GITHUB_SHA;

if (!sha) {
	console.error('Missing env variable: GITHUB_SHA');
	process.exit(1);
}

async function wrap() {
	try {
		const packageJson = await configureForRelease(sha);
		await publishPackage(sha, packageJson);
		console.log('Recipe "publish" completed successfully');
	} catch (error) {
		console.error('Recipe "publish" failed');
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
		if (error.constructor?.name !== 'ProcessOutput') {
			console.error(error);
		}

		process.exit(1);
	}
}

void wrap();
