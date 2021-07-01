#! /usr/bin/env node
const recipe = process.argv[2];

if (!recipe) {
	console.error('Usage: release-recipe <recipe>');
	process.exit(1);
}

import(`./recipes/${recipe.toLowerCase()}.js`).catch(error => {
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
	if (error.code === 'ERR_MODULE_NOT_FOUND') {
		console.error(`Recipe "${recipe.toLowerCase()}" does not exist`);
	} else {
		console.error(`Failed running recipe "${recipe.toLowerCase()}"`);
	}

	process.exit(1);
});
