import {$} from 'zx';
import {configureForRelease, PackageJson as MinimalPackageJson} from '../api/configure-for-release.js';
import {getShaFromEnvironment} from '../api/get-sha-from-env.js';
import {publishPackage} from '../api/publish-package.js';

interface PackageJson extends MinimalPackageJson {
	scripts?: {
		prepublish?: string;
		'test::for-release'?: string;
	};
}

async function wrap() {
	const sha = getShaFromEnvironment();
	const packageJson = await configureForRelease(sha) as PackageJson;

	await $`yarn install --frozen-lockfile`;
	await $`yarn lint`;
	await $`yarn test`;

	await publishPackage(sha, packageJson);
}

void wrap();
