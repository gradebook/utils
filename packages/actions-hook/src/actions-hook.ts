/* eslint-disable @typescript-eslint/ban-types */
import {createHmac} from 'crypto';
import got from 'got';

// @NOTE: we ignore this next line because we want to use the package.json that's shipped rather than a copy that might have missing or outdated data.
// @ts-expect-error
import {name, version} from '../package.json';

export const userAgent = `${name}@${version} (Actions)`;

export interface ConditionalHook {
	branch?: string;
	isPush?: boolean;
	repository?: string;
}

export interface PayloadOptions {
	url?: string;
	payload: object | string;
	secret?: string;
	log?: (message: string) => void;
	onlyIf?: false | ConditionalHook;
}

export async function sendPayload({
	url = process.env.WEBHOOK_URL,
	payload,
	secret = process.env.WEBHOOK_SECRET,
	log = console.log,
	onlyIf = false
}: PayloadOptions): Promise<void> {
	if (typeof payload !== 'string') {
		if (Object.prototype.hasOwnProperty.call(payload, 'toString')) {
			// Object.hasOwnProperty prevents us calling toString up the prototype chain
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			payload = payload.toString();
		} else {
			payload = JSON.stringify(payload);
		}
	}

	if (!url || !secret) {
		throw new TypeError('Both URL and Secret must be provided');
	}

	if (typeof onlyIf === 'object') {
		const config: ConditionalHook = {
			branch: (process.env.GITHUB_REF || '').split('/').pop(),
			isPush: process.env.GITHUB_EVENT_NAME === 'push',
			repository: process.env.GITHUB_REPOSITORY
		};

		// eslint-disable-next-line guard-for-in
		for (const filter in onlyIf) {
			if (!Object.hasOwnProperty.call(config, filter)) {
				log(`[actions-hook](warning) unknown filter "${filter}"`);
				continue;
			}

			// @ts-expect-error
			const received: string | boolean = config[filter];
			// @ts-expect-error
			const expected: string | boolean = onlyIf[filter];

			if (expected !== received) {
				log(
					`[actions-hook] not sending webhook because ${filter} differs - expected "${expected}" but got "${received}"`
				);
				return;
			}
		}
	}

	const hmac = createHmac('sha256', Buffer.from(secret)).update(payload).digest('hex');

	log(`Sending payload ${payload} to webhook\n\n`);

	await got.post(url, {
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': userAgent,
			'X-Actions-Secret': `sha256=${hmac}`
		},
		body: payload
	});
}

export default sendPayload;
