import {env, exit} from 'process';

export function getKeyFromEnvironment(key: string) {
	const value = env[key];

	if (!value) {
		console.error('Missing env variable: %s', key);
		exit(1);
	}

	return value;
}

export const repositoryInGitHubActions = 'GITHUB_REPOSITORY';
export const shaInGitHubActions = 'GITHUB_SHA';
export const tokenInGitHubActions = 'GITHUB_TOKEN';
