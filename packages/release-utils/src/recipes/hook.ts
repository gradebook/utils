import {ConditionalHook, parseBranchName, sendPayload} from '../api/actions-hook.js';
import {requireEnvVariables} from '../util/require-env-variables.js';

const GLOBAL_REQUIRED_KEYS = ['GITHUB_REF', 'GITHUB_REPOSITORY', 'GITHUB_SHA'] as const;
const GENERIC_REQUIRED_KEYS = ['WEBHOOK_DATA'] as const;
const SPECIFIC_REQUIRED_KEYS = ['TEST_NAME'] as const;

type Env = {
	[key in typeof GLOBAL_REQUIRED_KEYS[number]]: string;
} & {
	GITHUB_ACTOR?: string;
	REQUIRE_BRANCH?: string;
	CONDITION_REQUIRE_PUSH?: string;
	REQUIRE_REPOSITORY?: string;
};

type SpecificEnv = Env & {
	[key in typeof SPECIFIC_REQUIRED_KEYS[number]]: string;
};

type GenericEnv = Env & {
	[key in typeof GENERIC_REQUIRED_KEYS[number]]: string;
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

async function sendCiTrackingPayload({branchName}: {branchName: string}) {
	requireEnvVariables(SPECIFIC_REQUIRED_KEYS);

	// @ts-expect-error the required keys have already been validated
	const env: SpecificEnv = process.env;

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

async function sendGenericPayload() {
	requireEnvVariables(GENERIC_REQUIRED_KEYS);

	// @ts-expect-error the required keys have already been validated
	const env: GenericEnv = process.env;

	const payload = JSON.parse(env.WEBHOOK_DATA) as Record<string, any>;

	await sendPayload({payload, method: process.env.HOOK_METHOD ?? 'post'});
}

async function wrap() {
	const hookType = process.env.HOOK_TYPE ?? 'ci_tracking';
	requireEnvVariables(GLOBAL_REQUIRED_KEYS);

	// @ts-expect-error the required keys have already been validated
	const env: Env = process.env;
	const branchName = parseBranchName(env.GITHUB_REF);

	if (hookType !== 'generic' && hookType !== 'ci_tracking') {
		throw new Error(`Invalid HOOK_TYPE - expecting "generic" or "ci_tracking" but got ${hookType}`);
	}

	if (env.GITHUB_ACTOR) {
		console.log(`Actor is ${env.GITHUB_ACTOR}`);
	}

	if (isBot(env.GITHUB_ACTOR ?? null, branchName)) {
		console.log('[hook] Dependency update detected. Not running hook');
		return;
	}

	if (hookType === 'ci_tracking') {
		return sendCiTrackingPayload({branchName});
	}

	return sendGenericPayload();
}

void wrap().catch(error => {
	console.error('Failed to send hook:');
	console.error(error);
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
});
