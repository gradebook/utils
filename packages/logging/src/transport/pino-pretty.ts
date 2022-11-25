import * as PinoPretty from 'pino-pretty';

const createSafeLogger = (options: Partial<PinoPretty.PrettyOptions>) => PinoPretty.default({
	// @ts-expect-error this is documented in the README, but not as part of the TS types.
	customColors: 'message:white',
	useOnlyCustomProps: false,
	...options,
});

export default createSafeLogger;
