import {$} from 'zx';
import {configureForRelease, PackageJson as MinimalPackageJson} from '../api/configure-for-release.js';
import {getShaFromEnvironment} from '../api/get-sha-from-env.js';
import {publishPackage} from '../api/publish-package.js';

const SPECIAL_SCRIPT = 'autorelease:test';
const FALLBACK_SCRIPT = 'test';

interface PackageJson extends MinimalPackageJson {
	scripts?: {
		prepublish?: string;
		[SPECIAL_SCRIPT]?: string;
		[FALLBACK_SCRIPT]?: string;
	};
}

async function wrap() {
	const sha = getShaFromEnvironment();
	const packageJson = await configureForRelease(sha) as PackageJson;

	if (!packageJson.scripts?.[SPECIAL_SCRIPT] && !packageJson.scripts?.[FALLBACK_SCRIPT]) {
		console.error('Package does not contain a test script');
		console.error(`Ensure .scripts.${SPECIAL_SCRIPT} or .scripts.${FALLBACK_SCRIPT} exists`);
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	const testScript = SPECIAL_SCRIPT in packageJson.scripts ? SPECIAL_SCRIPT : FALLBACK_SCRIPT;

	await $`yarn lint`;
	await $`yarn ${testScript}`;

	await publishPackage(sha, packageJson);
}

void wrap();
