import {Buffer} from 'buffer';
import process from 'process';
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {readFileSync} from 'fs';
import {createHmac} from 'crypto';

const packageJsonFilePath = resolve(fileURLToPath(import.meta.url), '../../../package.json');
const {name, version} = JSON.parse(readFileSync(packageJsonFilePath, 'utf8')) as Record<string, string>;

export const userAgent = `${name}@${version} (Actions)`;

export interface ConditionalHook {
	branch?: string;
	isPush?: boolean;
	repository?: string;
}

export interface PayloadOptions {
	payload: object | string; // eslint-disable-line @typescript-eslint/ban-types
	method?: string;
	url?: string;
	secret?: string;
	log?: (message: string) => void;
	onlyIf?: false | ConditionalHook;
	branch?: string;
	event?: string;
	repository?: string;
	fetch?: typeof globalThis['fetch'];
}

export function parseBranchName(ref: string): string {
	return ref.replace(/refs\/(heads|tags)\//, '');
}

export async function sendPayload({
	url = process.env.WEBHOOK_URL,
	method = 'post',
	payload,
	secret = process.env.WEBHOOK_SECRET,
	log = console.log,
	fetch = globalThis.fetch,
	onlyIf = false,
	branch = parseBranchName(process.env.GITHUB_REF ?? ''),
	event = process.env.GITHUB_EVENT_NAME,
	repository = process.env.GITHUB_REPOSITORY,
}: PayloadOptions): Promise<boolean> {
	if (typeof payload !== 'string') {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		payload = Object.prototype.hasOwnProperty.call(payload, 'toString') ? payload.toString() : JSON.stringify(payload);
	}

	if (!url || !secret) {
		throw new TypeError('Both URL and Secret must be provided');
	}

	if (typeof onlyIf === 'object') {
		const config: ConditionalHook = {
			branch,
			isPush: event === 'push',
			repository,
		};

		const filters = Object.keys(onlyIf) as Array<keyof ConditionalHook>;

		for (const filter of filters) {
			if (!Object.hasOwnProperty.call(config, filter)) {
				log(`[actions-hook](warning) unknown filter "${filter}"`);
				continue;
			}

			const received = config[filter]!;
			const expected = onlyIf[filter]!;

			if (expected !== received) {
				log(
					`[actions-hook] not sending webhook because ${filter} differs - expected "${expected}" but got "${received}"`,
				);
				return true;
			}
		}
	}

	const hmac = createHmac('sha256', Buffer.from(secret)).update(payload).digest('hex');

	log(`Sending payload ${payload} to webhook\n\n`);

	const response = await fetch(url, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': userAgent,
			'X-Actions-Secret': `sha256=${hmac}`,
		},
		body: method.toLowerCase() === 'get' ? undefined : payload,
	});

	const responsePayload = await response.text();

	log(`Response status: ${response.status}`);
	log(`Response Payload:\n ${responsePayload}`);

	return response.ok;
}

export default sendPayload;
