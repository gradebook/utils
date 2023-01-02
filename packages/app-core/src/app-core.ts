import {getConfig} from '@gradebook/config';
import {createConfig, createLogger} from '@gradebook/logging';

export const config = await getConfig();
export const logger = await createLogger(config.get('logging'));

// @todo: this config coercion happens 2x (once internally and once here) - can we limit it to 1x?
export const $$loggingConfig = createConfig(config.get('logging'));
