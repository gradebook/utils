import {env, exit} from 'process';
import {deploy} from './netlify-deploy.js';
import {setAuthToken} from './api/netlify-hardcoded-api.js';

// eslint-disable-next-line import/no-extraneous-dependencies
const {getKeyFromEnvironment} = await import('@gradebook/release-utils/lib/api/get-var-from-env.js')
	.catch(() => {
		console.error('@gradebook/release-utils is a peer dependency');
		exit(1);
	});

function defaultTo<T>(key: string, fallback: T) {
	if (!(key in env)) {
		return fallback;
	}

	if (typeof fallback === 'boolean') {
		return process.env[key]!.toLowerCase() === 'true';
	}
}

setAuthToken(getKeyFromEnvironment('NETLIFY_AUTH_TOKEN'));

const options: Parameters<typeof deploy>[0] = {
	dir: getKeyFromEnvironment('NETLIFY_DEPLOY_DIR'),
	prod: getKeyFromEnvironment('NETLIFY_PRODUCTION_DEPLOY') !== 'false',
	site: getKeyFromEnvironment('NETLIFY_SITE_ID'),
	title: getKeyFromEnvironment('NETLIFY_DEPLOY_TITLE'),
	silent: defaultTo('NETLIFY_SILENT', false),
};

if ('NETLIFY_TIMEOUT' in env) {
	try {
		options.timeout = Number(env.NETLIFY_TIMEOUT);
	} catch {
		console.error('Failed to coerce NETLIFY_TIMEOUT');
		exit(1);
	}
}

void deploy(options);
