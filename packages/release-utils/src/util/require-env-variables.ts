export function requireEnvVariables(requiredVariables: Readonly<string[]>) {
	const {env} = process;

	for (const key of requiredVariables) {
		if (!(key in env)) {
			console.error(`Missing environment variable: ${key}. Recipe failed`);
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit(1);
		}
	}
}
