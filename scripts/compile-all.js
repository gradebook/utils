// @ts-check
const path = require('path');
const {readdir} = require('fs').promises;
const execa = require('execa');
const chalk = require('chalk').default;

const tsc = path.resolve(__dirname, '../node_modules/.bin/tsc');

/**
 * @param {object} packageJSON
 * @returns {string[]}
 */
function determineCompileTargets(packageJSON) {
	if (!Reflect.has(packageJSON, 'targets') || !Array.isArray(packageJSON.targets)) {
		console.error(
			chalk.red('Compilation failed! package.json does not contain an array of targets to compile to')
		);

		process.exit(1);
	}

	const projects = ['tsconfig.json'];

	for (const target of packageJSON.targets) {
		projects.push(`tsconfig.${target}.json`);
	}

	return projects;
}

/**
 * @param {string} project tsconfig project to use
 */
async function compileProject(project) {
	return execa('node', [tsc, '-p', project], {stdio: 'inherit'});
}

async function failIfLibContainsIllegalFiles() {
	try {
		const fileContents = await readdir(path.resolve(process.cwd(), 'lib'));

		for (const file of fileContents) {
			if (file.includes('.')) {
				console.error(
					chalk.red('The output folder (lib) contains an illegal file (') +
					file + chalk.red(').'),
					'Please remove the entire lib folder and run this command again'
				);

				process.exit(1);
			}
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			return;
		}

		console.error('An unknown error occurred');
		console.error(error);
		process.exit(1);
	}
}

async function run() {
	await failIfLibContainsIllegalFiles();
	const pkg = require(path.resolve(process.cwd(), 'package.json'));
	const projects = determineCompileTargets(pkg);

	const totalPackages = projects.length;
	let index = 1;

	for (const project of projects) {
		console.log(chalk.cyan('Compiling target %d/%d (%s)'), index++, totalPackages, project);
		await compileProject(project); // eslint-disable-line no-await-in-loop
	}
}

run();
