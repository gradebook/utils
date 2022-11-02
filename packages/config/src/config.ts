import process from 'process';
import fs from 'fs/promises';
import path from 'path';
import nconf from 'nconf';

const {Provider} = nconf;

export * from './coercion.js';

function isNormalError(error: unknown): error is Record<'message', string> {
	// @ts-expect-error use duck typing to get the error message
	return error
		&& Object.hasOwnProperty.call(error, 'message')
		&& typeof (error as Record<'message', unknown>).message === 'string';
}

export async function _init(forcedEnv?: string) {
	const env = forcedEnv ?? process.env.NODE_ENV ?? 'development';
	const fileRoot: string = process.env.GB_CONFIG_ROOT ?? await import('./root.js')
		.then(async mod => mod.findRoot(env));

	const defaults = await fs.readFile(path.resolve(fileRoot, 'config.example.json'), 'utf8')
		.then(file => JSON.parse(file) as Record<string, unknown>)
		.catch(error => {
			const originalErrorMessage = isNormalError(error) ? error.message : '';
			// @todo: use error cause when it's widely adopted
			throw new Error(`Failed loading default config\n${originalErrorMessage}`/* , {cause: _error} */);
		});

	return {defaults, fileRoot, env};
}

export async function getConfig(envOverride?: string) {
	const {defaults, fileRoot, env} = await _init(envOverride);
	const config = new Provider();

	config.argv()
		.env({separator: '__'})
		.file({file: path.resolve(fileRoot, `config.${env}.json`)});

	config.set('env', env);
	config.defaults(defaults);

	return config;
}
