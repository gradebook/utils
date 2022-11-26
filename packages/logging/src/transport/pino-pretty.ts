import * as PinoPretty from 'pino-pretty';

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
	...options,
});

export default createSafeLogger;
