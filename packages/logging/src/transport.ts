import {mkdir, stat} from 'fs/promises';
import path from 'path';
import {type LoggerOptions, transport} from 'pino';
import {type PrettyOptions} from 'pino-pretty';
import {type LoggingOptions} from './config.js';
import {type FileRotationOptions} from './transport/pino-file-rotate.js';

type Transport = LoggerOptions['transport'];

const getFileName = (options: LoggingOptions, rawLevel: string) => {
	const level = rawLevel === 'error' ? '.error' : '';
	// Based on ghost-ignition's file name generator
	const {path, domain = '', env} = options;
	const sanitizedDomain = domain.replace(/\W/gi, '_');
	return `${path}${sanitizedDomain}_${env}${level}.log`;
};

export const transports: Record<string, (options: LoggingOptions) => Transport | Promise<Transport>> = {
	stdout: () => transport<PrettyOptions>({
		target: './transport/pino-pretty.js',
		options: {
			// We use SYS here because it's expected that servers are in UTC time, but developer's machines
			// will be in their own time zone
			translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
			ignore: 'env,domain,pid',
		},
	}) as Transport,
	stdoutRaw: () => transport({target: 'pino/file'}) as Transport,
	async file(options: LoggingOptions) {
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
		}) as Transport;
	},
};
