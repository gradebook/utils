// @ts-check
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

const PACKAGE_ORDER = [
	// eslint-disable-next-line array-element-newline
	'name', 'version', 'private', 'description', 'keywords', 'author', 'homepage', 'bugs', 'license',
	// eslint-disable-next-line array-element-newline
	'main', 'directories', 'files', 'repository', 'scripts', 'dependencies', 'devDependencies', 'xo',
];

const TYPESCRIPT_CONFIG_FILE = {
	extends: '../../tsconfig.json',
	include: ['src/', '__tests__/'],
	compilerOptions: {
		outDir: 'lib',
	},
};

/**
 * @param {string} unscopedPackage
 */
async function exec(unscopedPackage) {
	const packageName = unscopedPackage.startsWith('@gradebook') ? unscopedPackage : `@gradebook/${unscopedPackage}`;
	const justName = packageName.replace('@gradebook/', '');
	const packageRoot = path.resolve(__dirname, '../packages/', packageName.replace('@gradebook/', ''));

	const isExistingProject = fs.existsSync(packageRoot);

	try {
		if (!isExistingProject) {
			const lernaCommand = `lerna create ${packageName} --access public --license MIT -y`;
			console.info(`Running \`${lernaCommand}\``);
			await execa.command(lernaCommand);
		}
	} catch (error) {
		console.error('Failed running lerna!');
		console.error(error.stdout || error.shortMessage || error.message);
		process.exit(1);
	}

	console.info('Updating package.json properties');

	const packagePath = path.resolve(packageRoot, 'package.json');

	/** @type {object} */
	let packageContents;
	try {
		packageContents = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	} catch (error) {
		console.error(`Failed reading package.json: ${error.message}`);
		process.exit(1);
	}

	packageContents.xo = false;
	if (packageContents.bugs.url) {
		packageContents.bugs = packageContents.bugs.url.replace('git+', '');
	}

	packageContents.repository.directory = `packages/${justName}`;
	if (!isExistingProject) {
		packageContents.version = '0.0.1';
		packageContents.scripts = {
			pretest: 'tsc',
			test: 'mocha __tests__ --recursive --colors',
			'test:coverage': 'c8 --reporter=html --reporter=text mocha __tests__ --recursive --colors',
			prepublish: 'tsc',
			tsc: 'tsc',
			lint: 'yarn --cwd ../../ xo "`pwd`/**/*"',
		};
		packageContents.files = ['lib', 'src'];
	}

	const newPackageContents = {};

	for (const key of PACKAGE_ORDER) {
		newPackageContents[key] = packageContents[key];
	}

	const remainingKeys = Object.keys(packageContents).filter(key => !PACKAGE_ORDER.includes(key));

	for (const key of remainingKeys) {
		newPackageContents[key] = packageContents[key];
	}

	delete newPackageContents.publishConfig;

	try {
		fs.writeFileSync(packagePath, JSON.stringify(newPackageContents, null, 2));
	} catch (error) {
		console.error(`Failed saving package.json: ${error.message}`);
		process.exit(1);
	}

	try {
		const tsConfigPath = path.resolve(packageRoot, 'tsconfig.json');
		if (!fs.existsSync(tsConfigPath)) {
			console.info('Creating typescript configuration file (tsconfig.json)');
			fs.writeFileSync(tsConfigPath, JSON.stringify(TYPESCRIPT_CONFIG_FILE, null, 2));
		}
	} catch (error) {
		console.error(`Failed saving tsconfig.json: ${error.message}`);
		process.exit(1);
	}

	if (!isExistingProject) {
		const packageSrc = path.resolve(packageRoot, 'src');
		const packageLib = path.resolve(packageRoot, 'lib');
		const packageBaseName = packageContents.main.replace('lib/', '').replace('.js', '');

		try {
			if (fs.existsSync(packageLib)) {
				console.info('Updating source folder name');
				fs.moveSync(packageLib, packageSrc);
			}
		} catch (error) {
			console.error(`Failed renaming folder: ${error.message}`);
			process.exit(1);
		}

		try {
			const sourcePath = path.resolve(packageRoot, 'src', packageBaseName + '.js');
			if (fs.existsSync(sourcePath)) {
				console.info('Updating source file extension');
				fs.renameSync(sourcePath, sourcePath.replace(/\.js$/, '.ts'));
			}
		} catch (error) {
			console.error(`Failed renaming file: ${error.message}`);
			process.exit(1);
		}

		const transform = contents => contents.replace(/ {4}/g, '\t').replace(/^'use strict';\s+/, '');

		try {
			console.info('Transforming test and source files');
			const srcPath = path.resolve(packageRoot, 'src', packageBaseName + '.ts');
			let fileContents = fs.readFileSync(srcPath, 'utf8');
			fs.writeFileSync(srcPath, transform(fileContents));

			const testPath = path.resolve(packageRoot, '__tests__', packageBaseName + '.test.js');
			fileContents = fs.readFileSync(srcPath, 'utf8');
			fs.unlinkSync(testPath);
			fs.writeFileSync(testPath.replace(/\.test\.js$/, '.spec.js'), transform(fileContents));
		} catch (error) {
			console.error(`Failed transforming files: ${error.message}`);
		}
	}
}

if (process.argv.length !== 3) {
	console.error('Usage:', process.argv[0], process.argv[1], '{package name}');
	process.exit(1);
}

exec(process.argv[2]);
