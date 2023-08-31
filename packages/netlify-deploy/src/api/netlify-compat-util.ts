import {argv, stdout, stderr, env} from 'process';
import {inspect, format} from 'util';
import {chalk} from 'zx'; // eslint-disable-line import/no-extraneous-dependencies

const BANG = '›';

/**
 * Logs a json message
 * @param {string|object} message
 */
export const logJson = (message: unknown = '', pretty = false) => {
	console.log(JSON.stringify(message, null, pretty ? 2 : 0));
};

export const log = (message = '', ...args) => {
	if (argv.includes('--silent')) {
		return;
	}

	message = typeof message === 'string' ? message : inspect(message);
	stdout.write(`${format(message, ...args as string[])}\n`);
};

/**
 * Logs a warning message
 * @param {string} message
 */
export const warn = (message = '') => {
	const bang = chalk.yellow(BANG);
	log(` ${bang}   Warning: ${message}`);
};

export const error = (message: string | Error = '', options: {exit?: boolean} = {}) => {
	const error_ = message instanceof Error ? message : new Error(message);
	if ('exit' in options && !options.exit) {
		const bang = chalk.red(BANG);
		if (env.DEBUG) {
			// @ts-expect-error gb: not worth fixing
			stderr.write(` ${bang}   Warning: ${error_.stack.split('\n').join(`\n ${bang}   `)}\n`);
		} else {
			stderr.write(` ${bang}   ${chalk.red(`${error_.name}:`)} ${error_.message}\n`);
		}
	} else {
		throw error_;
	}
};
