import * as PinoPretty from 'pino-pretty';
import {isColorSupported} from 'colorette'; // eslint-disable-line import/no-extraneous-dependencies
import {createSuccessMessage} from '../util/create-http-success-log.js';
import {prettyError} from '../util/pretty-error.js';

const ignitionColors = Object.entries({
	trace: 'grey',
	debug: 'grey',
	info: 'cyan',
	warn: 'magenta',
	error: 'red',
	fatal: 'inverse',
}).map(([level, color]) => `${level}:${color}`).join(',');

const messageFormatWithExclude: (ignore: string) => PinoPretty.PrettyOptions['messageFormat'] = (exclude: string) => {
	const EXCLUDE_KEYS = new Set(exclude.split(','));
	EXCLUDE_KEYS.add('level');
	EXCLUDE_KEYS.add('time');

	return (log, messageKey, _) => {
		if ('req' in log) {
		// @ts-expect-error we're using duck typing here
			return createSuccessMessage(log.req, log.res, log.responseTime, isColorSupported);
		}

		if ('err' in log || 'error' in log || ('stack' in log && 'message' in log)) {
			return prettyError((log as any).err ?? log.error ?? log, isColorSupported);
		}

		const response = log[messageKey];

		if (typeof response === 'object') {
			return JSON.stringify(response);
		}

		if (response !== undefined) {
			return response as string;
		}

		const sanitizedObject: Record<any, any> = {};
		for (const [key, value] of Object.entries(log)) {
			if (!EXCLUDE_KEYS.has(key)) {
				sanitizedObject[key] = value;
			}
		}

		return JSON.stringify(sanitizedObject);
	};
};

const createSafeLogger = (options: Partial<PinoPretty.PrettyOptions>) => PinoPretty.default({
	// @ts-expect-error this is documented in the README, but not as part of the TS types.
	customColors: `message:white,${ignitionColors}`,
	useOnlyCustomProps: false,
	hideObject: true,
	messageFormat: messageFormatWithExclude(options.ignore ?? ''),
	...options,
});

export default createSafeLogger;
