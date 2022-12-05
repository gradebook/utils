import {mkdir, stat} from 'fs/promises';
import {once} from 'events';
import {multistream, transport} from 'pino';
import {type PrettyOptions} from 'pino-pretty';
import {type LoggingOptions} from './config.js';
import {type FileRotationOptions} from './transport/pino-file-rotate.js';

const getFileName = (options: LoggingOptions, rawLevel: string) => {
	const level = rawLevel === 'error' ? '.error' : '';
	// Based on ghost-ignition's file name generator
	const {path, domain = '', env} = options;
	const sanitizedDomain = domain.replace(/\W/gi, '_');
	return `${path}${sanitizedDomain}_${env}${level}.log`;
};

type ThreadStream = any; // ThreadStream is untyped
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

type ThreadStreamFromOptions = (options: LoggingOptions) => ThreadStream;

const annotateWithLevel = (builder: ThreadStreamFromOptions) => async (options: LoggingOptions) => {
	const transport = await builder(options);
	transport.level = options.level;
	return transport;
};

export const transportBuilders: Record<string | symbol, ThreadStreamFromOptions> = {
	stdout: annotateWithLevel(() => transport<PrettyOptions>({
		target: './transport/pino-pretty.js',
		options: {
			// We use SYS here because it's expected that servers are in UTC time, but developer's machines
			// will be in their own time zone
			translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
			ignore: 'env,domain,pid,name,req,res,responseTime',
		},
	}) as ThreadStream),
	stdoutRaw: annotateWithLevel(() => transport({target: 'pino/file'}) as ThreadStream),
	file: annotateWithLevel(async (options: LoggingOptions) => {
		if (!await stat(options.path).catch(_ => null)) {
			await mkdir(options.path);
		}

		return transport<FileRotationOptions>({
			targets: [options.level, 'error'].map(level => ({
				target: './transport/pino-file-rotate.js',
				level,
				options: {
					destination: getFileName(options, level),
					rotation: options.rotation,
				},
			})),
		}) as ThreadStream;
	}),
};
/* eslint-enable @typescript-eslint/no-unsafe-return */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */

export async function getPinoTransport(options: LoggingOptions): Promise<ThreadStream> {
	const {transports} = options;
	if (transports.length === 0) {
		return null;
	}

	if (transports.length === 1) {
		const [transport] = transports;
		if (!(transport in transportBuilders)) {
			const knownTransports = Object.keys(transportBuilders).join(', ');
			throw new Error(`Unknown transport "${transport}". Known transports: ${knownTransports}`);
		}

		return transportBuilders[transport](options) as Promise<ThreadStream>;
	}

	// We could do this in the Promise.all block, but this gives us cleaner errors
	const failures = [];
	for (const [index, transport] of transports.entries()) {
		if (!(transport in transportBuilders)) {
			failures.push([index, transport]);
		}
	}

	if (failures.length > 0) {
		const knownTransports = Object.keys(transportBuilders).join(', ');
		const firstLine = 'One or more transports are invalid. Known transports: ' + knownTransports + '\n';
		const remainingLines = failures.map(failure => `  - transports[${failure[0]}] "${failure[1]}"\n`).join('');
		throw new Error(firstLine + remainingLines);
	}

	const transportStreams = await Promise.all(
		// ThreadStream is untyped
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		transports.map(transport => transportBuilders[transport](options)),
	);

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	await Promise.all(transportStreams.map(stream => once(stream, 'ready')));

	return multistream(transportStreams);
}
