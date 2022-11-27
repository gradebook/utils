import * as PinoPretty from 'pino-pretty';
import {isColorSupported} from 'colorette'; // eslint-disable-line import/no-extraneous-dependencies
import {createSuccessMessage} from '../util/create-http-success-log.js';

const ignitionColors = Object.entries({
	trace: 'grey',
	debug: 'grey',
	info: 'cyan',
	warn: 'magenta',
	error: 'red',
	fatal: 'inverse',
}).map(([level, color]) => `${level}:${color}`).join(',');

const createSafeLogger = (options: Partial<PinoPretty.PrettyOptions>) => PinoPretty.default({
	// @ts-expect-error this is documented in the README, but not as part of the TS types.
	customColors: `message:white,${ignitionColors}`,
	useOnlyCustomProps: false,
	messageFormat(log, messageKey, _) {
		if ('req' in log) {
			// @ts-expect-error we're using duck typing here
			return createSuccessMessage(log.req, log.res, log.responseTime, isColorSupported);
		}

		return log[messageKey] as string;
	},
	...options,
});

export default createSafeLogger;
