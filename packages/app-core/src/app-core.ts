import process from 'node:process';
import util from 'node:util';
import {type Logger} from 'pino'; // eslint-disable-line import/no-extraneous-dependencies
import {getConfig} from '@gradebook/config';
import {createConfig, createLogger} from '@gradebook/logging';

export const config = await getConfig();

let loadedLogger!: Logger;

try {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	loadedLogger = await createLogger(config.get('logging'));
} catch (error) {
	process.stderr.write('Failed creating logger:\n');
	process.stdout.write(util.inspect(error));
	process.stdout.write('\n');
}

export const logger = loadedLogger;
// @todo: this config coercion happens 2x (once internally and once here) - can we limit it to 1x?
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
export const $$loggingConfig = createConfig(config.get('logging'));
