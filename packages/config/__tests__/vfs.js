// @ts-check
import process from 'process';
import fs from 'fs/promises';
import syncFs from 'fs';
import sinon from 'sinon';

const originalReadFileSync = syncFs.readFileSync;

const files = {
	'/vfs/spec-generic/config.example.json': {
		symlink: null,
		content: JSON.stringify({
			exampleLoaded: true,
			configName: 'genericExample',
		}),
	},

	'/vfs/spec-generic/config.development.json': {
		symlink: null,
		content: JSON.stringify({
			developmentLoaded: true,
			configName: 'genericDevelopment',
			coercionTest: 'false',
		}),
	},

	'/vfs/spec-generic/config.production.json': {
		symlink: null,
		content: JSON.stringify({
			productionLoaded: true,
			configName: 'genericProduction',
		}),
	},

	'/vfs/spec-symlink/cwd/config.example.json': {
		symlink: '/vfs/spec-generic/config.example.json',
		get content() {
			return files['/vfs/spec-generic/config.example.json'].content;
		},
	},

	'/vfs/spec-symlink/cwd/config.development.json': {
		symlink: null,
		content: JSON.stringify({
			developmentLoaded: true,
			configName: 'symlinkDevelopment',
		}),
	},

	'/vfs/spec-env-override/cwd/config.example.json': {
		symlink: '/vfs/spec-generic/config.example.json',
		get content() {
			return files['/vfs/spec-generic/config.example.json'].content;
		},
	},

	'/vfs/spec-env-override/cwd/config.development.json': {
		symlink: null,
		content: JSON.stringify({
			developmentLoaded: true,
			configName: 'envOverrideDevelopment',
		}),
	},

	'/vfs/spec-env-override/cwd/config.production.json': {
		symlink: null,
		content: JSON.stringify({
			productionLoaded: true,
			configName: 'envOverrideProduction',
		}),
	},

	'/vfs/spec-env-override/cwd/config.mysql__test.json': {
		symlink: null,
		content: JSON.stringify({
			mysqlTestLoaded: true,
			configName: 'envOverrideMysqlTest',
		}),
	},
};

export class VirtualFileSystem {
	readFileSync(file, ...rest) {
		if (!(file.pathname ?? file).startsWith('/vfs')) {
			return originalReadFileSync(file, ...rest);
		}

		const response = files[file]?.content;

		if (response) {
			return response;
		}

		throw new Error(`[stub] file "${file}" not found`);
	}

	existsSync(file) {
		return Boolean(files[file]);
	}

	readFile = async file => this.readFileSync(file);
	absPath = async file => {
		if (!files[file]) {
			throw new Error('file does not exist');
		}

		return {
			isFile() {
				return true;
			},
		};
	};

	reset(cwd = '/vfs/spec-generic') {
		sinon.restore();

		// @ts-expect-error partial stub
		sinon.stub(fs, 'stat').callsFake(this.absPath);
		sinon.stub(fs, 'readFile').callsFake(this.readFile);
		sinon.stub(process, 'cwd').returns(cwd);

		// Stubs for nconf
		sinon.stub(syncFs, 'existsSync').callsFake(this.existsSync);
		sinon.stub(syncFs, 'readFileSync').callsFake(this.readFileSync);
	}
}
