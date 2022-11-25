import {pid} from 'process';
import {hostname} from 'os';
import {pino, stdTimeFunctions} from 'pino';
import {transports} from './transport.js';
import {type LoggingOptions} from './types.js';

const redact = ['*.cookie', '*["set-cookie"]', '*.authorization'];

const ignitionLegacyOptions: LoggingOptions = {};

export const logger = pino({
	redact,
	timestamp: stdTimeFunctions.isoTime,
	base: {
		pid,
		hostname,
		name: ignitionLegacyOptions.name ?? 'Log',
		env: ignitionLegacyOptions.env ?? 'development',
		domain: ignitionLegacyOptions.domain ?? 'localhost',
	},
// @TODO: This is the correct invocation - figure out why we need to cast as `any`
}, transports.stdout as any);

logger.info('Hello, world!');
logger.error('Hello, world!');
