/* eslint-disable unicorn/no-process-exit */
if (process.env.GB_SKIP_CHECK) {
	console.log('I hope you know what you\'re doing...');
	process.exit(0);
}

const {original} = JSON.parse(process.env.npm_config_argv);

if (original[1].toLowerCase() === 'create') {
	console.error('`lerna create` doesn\'t work. Use `yarn new` instead.');
	process.exit(1);
}
