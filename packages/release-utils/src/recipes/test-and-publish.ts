import {exit} from 'process';
import {$} from 'zx';
import type {PackageJson as MinimalPackageJson} from '../api/configure-for-release.js';
import {configureForRelease} from '../api/configure-for-release.js';
import * as envCore from '../api/get-var-from-env.js';
import {publishPossibleGitHubRelease} from '../api/publish-github-release.js';
import {publishPackage} from '../api/publish-package.js';

const PRE_HOOK_SCRIPT = 'autorelease:hook.pre';
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
	const sha = envCore.getKeyFromEnvironment(envCore.shaInGitHubActions);
	const repository = envCore.getKeyFromEnvironment(envCore.repositoryInGitHubActions);
	const token = envCore.getKeyFromEnvironment(envCore.tokenInGitHubActions);

	const packageJson = await configureForRelease(sha) as PackageJson;

	if (!packageJson.scripts?.[SPECIAL_SCRIPT] && !packageJson.scripts?.[FALLBACK_SCRIPT]) {
		console.error('Package does not contain a test script');
		console.error(`Ensure .scripts.${SPECIAL_SCRIPT} or .scripts.${FALLBACK_SCRIPT} exists`);
		exit(1);
	}

	const testScript = SPECIAL_SCRIPT in packageJson.scripts ? SPECIAL_SCRIPT : FALLBACK_SCRIPT;

	if (PRE_HOOK_SCRIPT in packageJson.scripts) {
		await $`yarn ${PRE_HOOK_SCRIPT}`;
	}

	await $`yarn lint`;
	await $`yarn ${testScript}`;

	const tagName = await publishPackage(sha, packageJson);
	await publishPossibleGitHubRelease({tagName, repository, token});
}

void wrap().catch(error => {
	console.error('Failed to test and publish:');
	console.error(error);
	exit(1);
});
