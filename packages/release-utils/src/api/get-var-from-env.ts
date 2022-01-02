export function getKeyFromEnvironment(key: string) {
	const value = process.env[key];

	if (!value) {
		console.error('Missing env variable: %s', key);
		process.exit(1); // eslint-disable-line unicorn/no-process-exit
	}

	return value;
}

export const repositoryInGitHubActions = 'GITHUB_REPOSITORY';
export const shaInGitHubActions = 'GITHUB_SHA';
export const tokenInGitHubActions = 'GITHUB_TOKEN';
