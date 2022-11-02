import {env, exit} from 'process';

export function requireEnvVariables(requiredVariables: Readonly<string[]>) {
	for (const key of requiredVariables) {
		if (!(key in env)) {
			console.error(`Missing environment variable: ${key}. Recipe failed`);
			exit(1);
		}
	}
}
