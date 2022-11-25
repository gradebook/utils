import {pid} from 'process';
import {hostname} from 'os';
import {pino, stdTimeFunctions} from 'pino';
import {transports} from './transport.js';
import {type RawLoggingOptions, createSafeOptions} from './config.js';

const redact = ['*.cookie', '*["set-cookie"]', '*.authorization'];

const rawIgnitionLegacyOptions: RawLoggingOptions = {};
const ignitionLegacyOptions = createSafeOptions(rawIgnitionLegacyOptions);

export const logger = pino({
	redact,
	timestamp: stdTimeFunctions.isoTime,
	base: {
		pid,
		hostname,
		name: ignitionLegacyOptions.name,
		env: ignitionLegacyOptions.env,
		domain: ignitionLegacyOptions.domain,
	},
// @TODO: This is the correct invocation - figure out why we need to cast as `any`
}, transports.stdout as any);

logger.info('Hello, world!');
logger.error('Hello, world!');
