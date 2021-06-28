/**
 * @description extracts the commit SHA from the environment
 *
 * Currently only supports GitHub Actions, but can support more environments if needed.
 */
export function getShaFromEnvironment() {
	const sha = process.env.GITHUB_SHA;

	if (!sha) {
		console.error('Missing env variable: GITHUB_SHA');
		/* eslint-disable-next-line unicorn/no-process-exit */
		process.exit(1);
	}

	return sha;
}
