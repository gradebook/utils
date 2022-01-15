import {Asset, uploadGitHubReleaseAssets} from '../api/upload-github-release-asset.js';
import {requireEnvVariables} from '../util/require-env-variables.js';
import {parseBranchName} from '../api/actions-hook.js';

const REQUIRED_KEYS = ['GITHUB_REPOSITORY', 'GITHUB_REF', 'GITHUB_TOKEN', 'FILE_LIST'] as const;

type Env = {
	[key in typeof REQUIRED_KEYS[number]]: string;
};

function getAssets(maybeJson: string): Asset[] {
	try {
		return JSON.parse(maybeJson) as Asset[];
	} catch (error) {
		console.error('Failed parsing FILE_LIST variable');
		console.error('It should be a JSON array matching with each element matching:');
		console.error('   string | [path: string, name: string]');
		console.error();
		console.error('Error:');
		console.error(error);
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
}

async function wrap() {
	requireEnvVariables(REQUIRED_KEYS);

	// @ts-expect-error requireEnvVariables ensures this won't be an issue.
	const env: Env = process.env;
	const tagName = parseBranchName(env.GITHUB_REF);
	const assets = getAssets(env.FILE_LIST.replace(/:tag:/g, tagName));

	const results = await uploadGitHubReleaseAssets({
		token: env.GITHUB_TOKEN,
		repository: env.GITHUB_REPOSITORY,
		tagName,
	}, assets);

	const failed = results.filter(result => !result);
	const numberOfFailures = failed.length;

	if (numberOfFailures === 0) {
		console.log('All assets successfully uploaded');
		return;
	}

	console.log('%d asset%s failed to upload:', numberOfFailures, numberOfFailures > 1 ? 's' : '');

	for (const [index, success] of results.entries()) {
		if (!success) {
			const asset = assets[index];
			const assetName = Array.isArray(asset) ? `${asset[0]} (${asset[1]})` : asset;
			console.log(`  ${assetName}`);
		}
	}
}

void wrap();
