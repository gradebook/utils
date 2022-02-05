// @ts-check
import {expect} from 'chai';
import {getConfig, coerceKeyToBoolean} from '../lib/config.js';
import {VirtualFileSystem} from './vfs.js';

const originalEnv = {
	GB_CONFIG_ROOT: process.env.GB_CONFIG_ROOT,
	NODE_ENV: process.env.NODE_ENV,
};

/**
 * @param {keyof typeof originalEnv} key
 */
const resetEnvKey = key => {
	if (key in process.env) {
		delete process.env[key];
	}

	if (originalEnv[key]) {
		process.env[key] = originalEnv[key];
	}
};

const vfs = new VirtualFileSystem();

describe('Unit > Config', function () {
	beforeEach(function () {
		vfs.reset();
		resetEnvKey('GB_CONFIG_ROOT');
		resetEnvKey('NODE_ENV');
	});

	it('Generic', async function () {
		const config = await getConfig();
		expect(config.get('exampleLoaded')).to.be.true;
		expect(config.get('developmentLoaded')).to.be.true;
		expect(config.get('env')).to.equal('development');
		expect(config.get('configName')).to.equal('genericDevelopment');
	});

	it('Symlink', async function () {
		vfs.reset('/vfs/spec-symlink/cwd/');
		const config = await getConfig();
		expect(config.get('exampleLoaded')).to.be.true;
		expect(config.get('developmentLoaded')).to.be.true;
		expect(config.get('env')).to.equal('development');
		expect(config.get('configName')).to.equal('symlinkDevelopment');
	});

	it('Environment - cwd', async function () {
		process.env.GB_CONFIG_ROOT = '/vfs/spec-env-override/cwd/';
		const config = await getConfig();
		expect(config.get('exampleLoaded')).to.be.true;
		expect(config.get('developmentLoaded')).to.be.true;
		expect(config.get('env')).to.equal('development');
		expect(config.get('configName')).to.equal('envOverrideDevelopment');
	});

	it('Environment - env', async function () {
		process.env.GB_CONFIG_ROOT = '/vfs/spec-env-override/cwd/';
		process.env.NODE_ENV = 'mysql__test';
		const config = await getConfig();
		expect(config.get('exampleLoaded')).to.be.true;
		expect(config.get('mysqlTestLoaded')).to.be.true;
		expect(config.get('env')).to.equal('mysql__test');
		expect(config.get('configName')).to.equal('envOverrideMysqlTest');
	});

	it('Recursive search yields no results', async function () {
		vfs.reset('/vfs/spec-does-not-exist/');
		try {
			await getConfig();
			expect(false, 'should have thrown').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('Unable to find config');
		}
	});

	it('Config root is not really a config root', async function () {
		process.env.GB_CONFIG_ROOT = '/vfs/path-does-not-exist';
		try {
			await getConfig();
			expect(false, 'should have thrown').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('Failed loading default config');
			expect(error.message).to.contain('/vfs/path-does-not-exist/config.example.json');
		}
	});

	it('coerceKeyToBoolean', async function () {
		const config = await getConfig();
		expect(config.get('coercionTest')).to.equal('false');
		coerceKeyToBoolean(config, 'coercionTest');
		expect(config.get('coercionTest')).to.be.false;
	});
});
