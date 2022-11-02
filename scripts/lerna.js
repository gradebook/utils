// @ts-check
const {env, exit} = require('process');

if (env.GB_SKIP_CHECK) {
	console.log('I hope you know what you’re doing…');
	exit(0);
}

const {original} = JSON.parse(env.npm_config_argv ?? '');

if (original[1].toLowerCase() === 'create') {
	console.error('`lerna create` doesn’t work. Use `yarn new` instead.');
	exit(1);
}
