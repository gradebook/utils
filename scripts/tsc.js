// @ts-check
import {env, exit} from 'process';

if (env.GB_SKIP_CHECK) {
	console.log('I hope you know what you’re doing…');
	exit(0);
}

console.error('You probably did not mean to run `tsc` in the repo root :)');
exit(1);
