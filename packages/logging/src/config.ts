import {cwd} from 'process';

type RequireDeep<X> = X extends null | undefined | string | number | boolean | symbol | bigint ? X : Required<{
	[K in keyof X]-?: Required<X[K]>;
}>;

interface RotationObject {
	/**
	 * @description the maximum number of rotated logs to keep
	 * @default 10
	 */
	count: number;
	/**
	 * @description should the rotated logs be gzipped?
	 * @default false
	 */
	gzip: boolean;
	/**
	 * @description NOT DOCUMENTED: Refer to https://github.com/TryGhost/bunyan-rotating-file-stream/blob/main/index.js
	 *  Only seems to apply to period-based rotation
	 * @default true
	 */
	rotateExisting: boolean;
	/**
	 * @description What schedule to rotate logs. Supported values:
	 *   - `hourly`
	 *   - `daily`
	 *   - `weekly`
	 *   - `monthly`
	 *   - `yearly`
	 *   - Simple period - \d+(ms|h|d|w|m|y)
	 * @default '1w'
	 */
	period: string;
	/**
	 * @description What file threshold to rotate logs. Supports simple sizes: \d+(b|k|m|g) e.g. 1g
	 * @default none
	 */
	threshold: string;
}

interface HealthCheckConfig {
	/**
	 * @description the minimum time (in minutes) to wait between logging healthcheck requests.
	 *  This reduces the amount of noise from healthchecks in the logs
	 * @default 10
	 */
	intervalInMinutes: number;
	/**
	 * @description the path that the http request listens on
	 * @default '/api/v0/health'
	 */
	path: string;
}

export interface RawLoggingOptions {
	/**
	 * @description Application name
	 * @default 'Log'
	 */
	name?: string;
	/**
	 * @description Application environment
	 * @default 'development'
	 */
	env?: string;
	/**
	 * @description Domain the application listens on
	 * @default 'localhost'
	 */
	domain?: string;
	/**
	 * @description Where the logs should be sent to.
	 *  - Passing an empty array will use silent logging.
	 *  - Supported transports:
	 *    - `stdout` - write logs to standard out
	 *    - `stdoutRaw` - write logs to standard out, but don't format them with `pino-pretty`
	 *    - `file`- write logs to `path`
	 * @default ['stdout']
	 */
	transports?: string[];
	/**
	 * @description The directory logs should be written to when using the `file` transport
	 * @default './logs'
	 */
	path?: string;
	/**
	 * @description Which log level to use. Supported levels (all levels below the selected level will be logged):
	 *  - trace
	 *  - debug
	 *  - info
	 *  - warn
	 *  - error
	 *  - fatal
	 * @default 'info'
	 */
	level?: string;
	// Documented in SafeObjectCoercedConfig
	rotation?: boolean | Partial<RotationObject>;
	// Documented in SafeObjectCoercedConfig
	healthcheck?: boolean | Partial<HealthCheckConfig>;
}

interface SafeObjectCoercedConfig {
	/**
	 * @description When using the `useHttpLogging` api, what path the healthcheck listens on, and the supression requirements
	 * @default Healthcheck is on `/api/v0/health` and logs once every 10 minutes
	 */
	healthcheck: HealthCheckConfig | null;
	/**
	 * @description Rotation configuration when using `file` transport. Pass `false` to disable rotation
	 * @default Weekly rotation
	 */
	rotation: RotationObject | null;
}

export type LoggingOptions = RequireDeep<Omit<RawLoggingOptions, keyof SafeObjectCoercedConfig>> & SafeObjectCoercedConfig;

const DEFAULT_ROTATION_OPTIONS = {
	count: 10,
	gzip: false,
	rotateExisting: true,
	period: '',
	threshold: '',
};

const DEFAULT_HEALTHCHECK_OPTIONS = {
	path: '/api/v0/health',
	intervalInMinutes: 10,
};

export function createSafeOptions(options: RawLoggingOptions): LoggingOptions {
	const response: LoggingOptions = {
		name: options.name ?? 'Log',
		env: options.env ?? 'development',
		domain: options.domain ?? 'localhost',
		level: options.level ?? 'info',
		path: (options.path ?? cwd() + '/logs').replace(/\/$/, '') + '/',
		rotation: options.rotation === false ? null : (
			(options.rotation === true || !options.rotation) ? {
				...DEFAULT_ROTATION_OPTIONS,
				period: '1w',
			} : Object.assign({} as RotationObject, DEFAULT_ROTATION_OPTIONS, options.rotation)
		),
		healthcheck: options.healthcheck === false ? null : (
			(options.healthcheck === true || !options.healthcheck)
				? {...DEFAULT_HEALTHCHECK_OPTIONS}
				: Object.assign({} as HealthCheckConfig, DEFAULT_HEALTHCHECK_OPTIONS, options.healthcheck)
		),
		transports: options.transports ?? ['stdout'],
	};

	if (response.rotation && !response.rotation.period && !response.rotation.threshold) {
		throw new Error('`threshold` or `period` must be provided for log rotation');
	}

	return response;
}
