import {once} from 'events';
import {destination} from 'pino';
import build from 'pino-abstract-transport'; // eslint-disable-line import/no-extraneous-dependencies
import {type LoggingOptions} from '../config.js';

interface RotatingFileStreamStub {
	_initialized: Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-misused-new
	new(config: unknown): RotatingFileStreamStub;
	write(message: string): void;
	end(): Promise<void>;
}

export interface FileRotationOptions {
	destination: string;
	rotation: LoggingOptions['rotation'];
}

// @ts-expect-error no types
// eslint-disable-next-line @typescript-eslint/promise-function-async
const importRfs = () => import('@tryghost/bunyan-rotating-filestream') as Promise<{default: RotatingFileStreamStub}>;

export default async function createStream(options: FileRotationOptions) {
	// Duck type rotation enabled
	if (!options.rotation) {
		// Based on 'pino/file'
		const response = destination({sync: false, dest: options.destination});
		await once(response, 'ready');
		return response;
	}

	const {default: RotatingFileStream} = await importRfs();
	const response = new RotatingFileStream({
		path: options.destination,
		...options.rotation,
	});

	await response._initialized;

	return build(async source => {
		for await (const object of source) {
			response.write(JSON.stringify(object) + '\n');
		}
	}, {
		async close() {
			await response.end();
		},
	});
}
