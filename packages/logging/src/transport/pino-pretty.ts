import createPretty, {type PinoPretty} from 'pino-pretty';
import {isColorSupported} from 'colorette'; // eslint-disable-line import/no-extraneous-dependencies
import {createSuccessMessage} from '../util/create-http-success-log.js';
import {prettyError} from '../util/pretty-error.js';

interface PrettyFormatOptions {
	disableRequestErrorFiltering?: boolean;
}

export type PrettyTransportOptions = PinoPretty.PrettyOptions & Partial<{
	messageFormatOptions: PrettyFormatOptions;
}>;

const ignitionColors = Object.entries({
	trace: 'grey',
	debug: 'grey',
	info: 'cyan',
	warn: 'magenta',
	error: 'red',
	fatal: 'inverse',
}).map(([level, color]) => `${level}:${color}`).join(',');

type MessageFormatFunc = Exclude<PinoPretty.PrettyOptions['messageFormat'], string | undefined | false>;

type CreateMessageFormatter = (ignore: string, messageFormatOptions: PrettyFormatOptions) => MessageFormatFunc;

const messageFormatWithExclude: CreateMessageFormatter = (
	ignore: string,
	{disableRequestErrorFiltering}: PrettyFormatOptions,
) => {
	const filterRequestErrors = !disableRequestErrorFiltering;
	const EXCLUDE_KEYS = new Set(ignore.split(','));
	EXCLUDE_KEYS.add('level');
	EXCLUDE_KEYS.add('time');

	return (log, messageKey, _) => {
		let messageBegin = '';

		if ('req' in log) {
			// @ts-expect-error we're using duck typing here
			messageBegin = createSuccessMessage(log.req, log.res, log.responseTime, isColorSupported);
		}

		if ('err' in log || 'error' in log || ('stack' in log && 'message' in log)) {
			const error = (log as {err?: Error}).err ?? (log as {error?: Error}).error ?? log as Record<string, string>;
			if (messageBegin) {
				if (filterRequestErrors) {
					// CASE: 404 - NotFoundError (generic 404) or PermissionError (403 error masked as a 404 to prevent snoops)
					const errorIsFiltered = (log.res as {status: number}).status === 404 && (error.name === 'NotFoundError' || error.name === 'PermissionError');

					if (errorIsFiltered) {
						return messageBegin;
					}
				}

				messageBegin += '\n\n';
			}

			return messageBegin + prettyError(error, isColorSupported);
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

const createSafeLogger = (options: Partial<PrettyTransportOptions>) => createPretty({
	customColors: `message:white,${ignitionColors}`,
	useOnlyCustomProps: false,
	hideObject: true,
	messageFormat: messageFormatWithExclude(options.ignore ?? '', options.messageFormatOptions ?? {}),
	...options,
});

export default createSafeLogger;

export const __test = {
	messageFormatWithExclude,
};
