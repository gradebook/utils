import {cwd} from 'process';

type RequireDeep<X> = X extends null | undefined | string | number | boolean | symbol | bigint ? X : Required<{
	[K in keyof X]-?: Required<X[K]>;
}>;

interface RotationObject {
	count: number;
	gzip: boolean;
	rotateExisting: boolean;
	period: string;
	threshold: string;
}

interface HealthCheckConfig {
	intervalInMinutes: number;
	path: string;
}

export interface RawLoggingOptions {
	name?: string;
	env?: string;
	domain?: string;
	transports?: string[];
	path?: string;
	level?: string;
	rotation?: boolean | Partial<RotationObject>;
	healthcheck?: boolean | Partial<HealthCheckConfig>;
}

export type LoggingOptions = RequireDeep<Omit<RawLoggingOptions, 'rotation' | 'healthcheck'>> & {rotation: RotationObject | null; healthcheck: HealthCheckConfig | null};

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
