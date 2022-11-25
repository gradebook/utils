import {type LoggerOptions, transport} from 'pino';
import {type PrettyOptions} from 'pino-pretty';

type Transport = LoggerOptions['transport'];

export const transports = {
	stdout: transport<PrettyOptions>({
		target: './transport/pino-pretty.js',
		options: {
			// We use SYS here because it's expected that servers are in UTC time, but developer's machines
			// will be in their own time zone
			translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
			ignore: 'env,domain,pid',
		},
	}) as Transport,
};
