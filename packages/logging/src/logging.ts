import {pid} from 'process';
import {hostname} from 'os';
import {pino, stdTimeFunctions} from 'pino';
import {getPinoTransport} from './transport.js';
import {type RawLoggingOptions, createSafeOptions} from './config.js';

const redact = ['*.cookie', '*["set-cookie"]', '*.authorization'];

const rawIgnitionLegacyOptions: RawLoggingOptions = {};
const ignitionLegacyOptions = createSafeOptions(rawIgnitionLegacyOptions);

export const logger = pino({
	redact,
	level: ignitionLegacyOptions.transports.length === 0 ? 'silent' : ignitionLegacyOptions.level,
	timestamp: stdTimeFunctions.isoTime,
	base: {
		pid,
		hostname,
		name: ignitionLegacyOptions.name,
		env: ignitionLegacyOptions.env,
		domain: ignitionLegacyOptions.domain,
	},
}, await getPinoTransport(ignitionLegacyOptions));

logger.info('Hello, world!');
logger.error('Hello, world!');
logger.trace('Hello, world!');
