// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import {publishPackage} from '../../lib/api/publish-package.js';
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
});
