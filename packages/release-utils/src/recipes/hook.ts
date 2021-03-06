import {ConditionalHook, parseBranchName, sendPayload} from '../api/actions-hook.js';
import {requireEnvVariables} from '../util/require-env-variables.js';

const REQUIRED_KEYS = ['GITHUB_REF', 'GITHUB_REPOSITORY', 'GITHUB_SHA', 'TEST_NAME'] as const;

type Env = {
	[key in typeof REQUIRED_KEYS[number]]: string;
} & {
	GITHUB_ACTOR?: string;
	REQUIRE_BRANCH?: string;
	CONDITION_REQUIRE_PUSH?: string;
	REQUIRE_REPOSITORY?: string;
};

function isBot(author: string | null, branchName: string) {
	const authorIsDependencyBot = author ? Boolean(/(renovate|dependabot)/i.test(author)) : false;

	return authorIsDependencyBot || (/^(dependabot|renovate)/i.exec(branchName));
}

function buildConfigObject(env: Env): ConditionalHook | false {
	const config: ConditionalHook = {};

	if ('REQUIRE_BRANCH' in env) {
		config.branch = env.REQUIRE_BRANCH;
	}

	if ('CONDITION_REQUIRE_PUSH' in env) {
		config.isPush = env.CONDITION_REQUIRE_PUSH!.toLowerCase() === 'true';
	}

	if ('REQUIRE_REPOSITORY' in env) {
		config.repository = env.REQUIRE_REPOSITORY;
	}

	if (Object.keys(config).length === 0) {
		console.log('[hook] No gating filters were specified');
		return false;
	}

	return config;
}

async function wrap() {
	requireEnvVariables(REQUIRED_KEYS);

	// @ts-expect-error the required keys have already been validated
	const env: Env = process.env;
	const branchName = parseBranchName(env.GITHUB_REF);

	if (env.GITHUB_ACTOR) {
		console.log(`Actor is ${env.GITHUB_ACTOR}`);
	}

	if (isBot(env.GITHUB_ACTOR ?? null, branchName)) {
		console.log('[hook] Dependency update detected. Not running post-test hook');
		return;
	}

	const payload = JSON.stringify({
		codebase: env.GITHUB_REPOSITORY,
		commit: env.GITHUB_SHA,
		branch: branchName,
		name: env.TEST_NAME,
	});

	console.log('[hook] Sending payload', payload, 'to webhook');
	console.log();
	console.log();

	await sendPayload({
		payload,
		onlyIf: buildConfigObject(env),
	});
}

void wrap().catch(error => {
	console.error('Failed to send hook:');
	console.error(error);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
});
