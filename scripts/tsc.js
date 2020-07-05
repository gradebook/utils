if (process.env.GB_SKIP_CHECK) {
	console.log('I hope you know what you’re doing…');
	process.exit(0);
}

console.error('You probably did not mean to run `tsc` in the repo root :)');
process.exit(1);
