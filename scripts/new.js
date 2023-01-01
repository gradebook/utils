// @ts-check
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const workspacePackage = require('../package.json');

// Optional keys: description, module, bin
const PACKAGE_ORDER = [
	// eslint-disable-next-line array-element-newline
	'name', 'version', 'private', 'description', 'keywords', 'author', 'homepage', 'bugs', 'license', 'type', 'main',
	// eslint-disable-next-line array-element-newline
	'module', 'bin', 'directories', 'files', 'repository', 'scripts', 'dependencies', 'devDependencies', 'xo',
];

const TYPESCRIPT_CONFIG_FILE = {
	extends: '../../tsconfig-esm.json',
	include: ['src/', '__tests__/'],
	compilerOptions: {
		outDir: 'lib',
	},
};

/**
 * @param {string} packagePath
 * @param {string} packageName
 * @param {boolean} isExistingProject
 * @returns {object}
 */
function updatePackageJson(packagePath, packageName, isExistingProject) {
	console.info('Updating package.json properties');
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

	packageContents.repository.directory = `packages/${packageName}`;
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
		packageContents.type = 'module';
		delete packageContents.module;
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
	if (newPackageContents.description?.includes('BOOM')) { // Lerna's default description contains BOOM
		delete newPackageContents.description;
	}

	const fullHomePagePath = path.resolve(
		'/',
		// Should become gradebook/utils
		// @ts-expect-error
		workspacePackage.repository.split(':').pop(),
		'tree/master',
		packageContents.repository.directory,
	);
	newPackageContents.homepage = `https://github.com${fullHomePagePath}#readme`;

	try {
		fs.writeFileSync(packagePath, JSON.stringify(newPackageContents, null, 2));
	} catch (error) {
		console.error(`Failed saving package.json: ${error.message}`);
		process.exit(1);
	}

	return newPackageContents;
}

/**
 * @param {string} currentFileContents
 * @param {string} sourceFile
 */
function createTestFile(currentFileContents, sourceFile) {
	/** @type {string} */
	// @ts-expect-error
	const firstLine = currentFileContents.split('\n').shift();

	const exportNameMatch = /export function ([a-z]+)\(/i.exec(firstLine);
	let exportName = '__FIXME__';

	if (exportNameMatch) {
		exportName = exportNameMatch[1];
	}

	return `
// @ts-check
import {expect} from 'chai';
import {${exportName}} from '${sourceFile}';

describe('Unit > ${exportName}', function () {
	it('Hello, world', function () {
		expect(${exportName}()).to.equal('Hello from ${exportName}');
	});
});
`.trimStart();
}

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
			const lernaCommand = `lerna create ${packageName} --access public --license MIT -y --es-module`;
			console.info(`Running \`${lernaCommand}\``);
			await execa.command(lernaCommand);
		}
	} catch (error) {
		console.error('Failed running lerna!');
		console.error(error.stdout || error.shortMessage || error.message);
		process.exit(1);
	}

	const packageJson = updatePackageJson(path.resolve(packageRoot, 'package.json'), justName, isExistingProject);

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
		const packageBaseName = packageJson.main
			.replace('lib/', '')
			.replace('dist/', '')
			.replace('.js', '');

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

		try {
			console.info('Transforming test and source files');
			const srcPath = path.resolve(packageRoot, 'src', packageBaseName + '.ts');
			let fileContents = fs.readFileSync(srcPath, 'utf8');
			fileContents = fileContents
				// Use tabs instead of spaces
				.replace(/ {4}/g, '\t')
				// Use named exports instead of default exports
				.replace(' default ', ' ')
				// Use single quotes instead of double quotes
				.replace(/"/g, '\'');
			fs.writeFileSync(srcPath, fileContents);

			const currentTestPath = path.resolve(packageRoot, '__tests__', packageBaseName + '.test.js');
			const newTestPath = currentTestPath.replace(/\.test\.js$/, '.spec.js');
			fs.unlinkSync(currentTestPath);
			const testImportPath = path.relative(newTestPath, srcPath)
				.replace('.ts', '.js')
				.replace('/src/', '/lib/');
			fs.writeFileSync(newTestPath, createTestFile(fileContents, testImportPath));
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
