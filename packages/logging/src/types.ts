export interface LoggingOptions {
	name?: string;
	env?: string;
	domain?: string;
	transports?: Array<'stdout' | 'stdoutRaw' | 'file'>;
	path?: string;
	level?: string;
	rotation?: false | {
		period: string;
		count: number;
		gzip: boolean;
		rotateExisting?: boolean;
	} & ({period: string} | {threshold: string});
}
