// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import {publishPackage, getReleaseTag, resolveTagName} from '../../lib/api/publish-package.js';
import {convertSinonStubToZX} from '../utils/cast-sinon-to-zx.js';
import {createZxStub} from '../utils/zx-stub.js';

/** @typedef {import('../../lib/api/configure-for-release').PackageJson} PackageJson */

describe('Unit > API > Package Publisher', function () {
	/** @type {import('sinon').SinonStub} */
	let $;
	/** @type {import('zx').$} */
	let zx$;

	beforeEach(function () {
		$ = sinon.stub();
		zx$ = convertSinonStubToZX($);
	});

	it('functional case', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3'}));
		/** @type {PackageJson} */
		const packageJson = {
			version: '0.3.3',
			scripts: {
				prepublish: 'true',
			},
		};

		await publishPackage('thisisahash', packageJson, zx$);
		expect($.calledTwice).to.be.true;
		expect($.args[1][1]).to.include('0.3.3');
	});

	it('tag name does not match version in package.json', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.4'}));

		/** @type {PackageJson} */
		const packageJson = {
			version: '0.3.3',
			scripts: {
				prepublish: 'true',
			},
		};

		try {
			await publishPackage('thisisahash', packageJson, zx$);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('does not match with version in package.json');
		}
	});

	it('invalid tag name', async function () {
		$.callsFake(createZxStub({tag: 'test-release'}));

		/** @type {PackageJson} */
		const packageJson = {
			version: '0.3.3',
			scripts: {
				prepublish: 'true',
			},
		};

		try {
			await publishPackage('thisisahash', packageJson, zx$);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('does not match with version in package.json');
		}
	});

	it('no prepublish script', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3'}));

		/** @type {PackageJson} */
		const packageJson = {
			version: '0.3.3',
			scripts: {
				// @ts-expect-error
				test: 'true',
			},
		};

		try {
			await publishPackage('thisisahash', packageJson, zx$);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('missing a prepublish script');
		}
	});

	it('getReleaseTag', function () {
		expect(getReleaseTag('not a tag')).to.equal('latest');
		expect(getReleaseTag('1.2.3')).to.equal('latest');
		expect(getReleaseTag('1.2.3.')).to.equal('latest');
		expect(getReleaseTag('1.2.3+abcdef')).to.equal('latest');
		expect(getReleaseTag('1.2.3-beta')).to.equal('beta');
		expect(getReleaseTag('1.2.3-beta.0')).to.equal('beta');
		expect(getReleaseTag('1.2.3-beta.0')).to.equal('beta');
		expect(getReleaseTag('1.0.0-beta+exp.sha.5114f85')).to.equal('beta');
		expect(getReleaseTag('1.0.0-x.7.z.92')).to.equal('x');
		expect(getReleaseTag('1.0.0-x-y-z.--')).to.equal('x-y-z');
	});

	it('resolveTagName', async function () {
		let shaResponse = '';
		let allowOnlyVersion = true;
		let allowNameAndVersion = false;
		$.callsFake(createZxStub({
			/** @param {string} command */
			tag(command) {
				if (command.includes(sha)) {
					return shaResponse;
				}

				if (
					allowNameAndVersion
					&& command.includes('@')
					&& command.includes(packageJson.version ?? 'never')
				) {
					return `${packageJson.name}@v${packageJson.version}`;
				}

				if (allowOnlyVersion && command.includes(packageJson.version ?? 'never')) {
					return `v${packageJson.version}`;
				}

				return '';
			},
		}));

		const sha = 'thisisahash';
		/** @type {PackageJson} */
		const packageJson = {
			name: 'a-package',
			version: '0.3.3',
			scripts: {
				// @ts-expect-error
				test: 'true',
			},
		};

		shaResponse = 'v1.2.3';
		allowOnlyVersion = false;
		allowNameAndVersion = false;
		expect(await resolveTagName(sha, packageJson, zx$)).to.equal(shaResponse);

		shaResponse = '';
		allowOnlyVersion = true;
		allowNameAndVersion = false;
		expect(await resolveTagName(sha, packageJson, zx$)).to.equal(`v${packageJson.version}`);

		shaResponse = '';
		allowOnlyVersion = false;
		allowNameAndVersion = true;
		expect(await resolveTagName(sha, packageJson, zx$)).to.equal(`${packageJson.name}@v${packageJson.version}`);

		shaResponse = '';
		allowOnlyVersion = false;
		allowNameAndVersion = false;
		expect(await resolveTagName(sha, packageJson, zx$)).to.equal(undefined);
	});
});
