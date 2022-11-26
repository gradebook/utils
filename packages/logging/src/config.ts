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

export interface RawLoggingOptions {
	name?: string;
	env?: string;
	domain?: string;
	transports?: string[];
	path?: string;
	level?: string;
	rotation?: boolean | Partial<RotationObject>;
}

export type LoggingOptions = RequireDeep<Omit<RawLoggingOptions, 'rotation'>> & {rotation: RotationObject | null};

const DEFAULT_ROTATION_OPTIONS = {
	count: 10,
	gzip: false,
	rotateExisting: true,
	period: '',
	threshold: '',
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
		transports: options.transports ?? ['stdout'],
	};

	if (response.rotation && !response.rotation.period && !response.rotation.threshold) {
		throw new Error('`threshold` or `period` must be provided for log rotation');
	}

	return response;
}
