import type {Application} from 'express';
import {serverDependencies} from '../server-dependencies.js';

export async function register(app: Application) {
	const {config} = await serverDependencies.import<{config: Map<string, boolean>}>(
		'./lib/config.js',
	);

	const cookieIsSecure = config.get('secure');

	app.use((request, response, next) => {
		const requestIsSecure = request.protocol === 'https';

		if (requestIsSecure === cookieIsSecure || request.query.ignoreProtocolMismatch) {
			next();
			return;
		}

		const firstNegation = cookieIsSecure ? '' : 'not ';
		const secondNegation = cookieIsSecure ? ' not' : '';

		const message = [
			'***SCHEME MISMATCH***',
			`Config is ${firstNegation}set to secure, but request protocol is${secondNegation}.`,
			`Request URL: ${request.url}`,
			'***SCHEME MISMATCH***',
		];

		if (request.path.includes('/api/')) {
			message.unshift('');
			serverDependencies.logging.warn(message.join('\n'));

			next();
			return;
		}

		message.splice(-1, 0, 'add <pre style="display: inline">ignoreProtocolMismatch=true</pre> to the query to bypass this message');

		response.status(421).send(message.join('\n<br />'));
	});
}
