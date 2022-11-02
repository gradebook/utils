// @ts-check
import path from 'path';
import process from 'process';
import {fileURLToPath} from 'url';
import {expect} from 'chai';
import sinon from 'sinon';
import {configureForRelease} from '../../lib/api/configure-for-release.js';
import {createZxStub} from '../utils/zx-stub.js';
import {convertSinonStubToZX} from '../utils/cast-sinon-to-zx.js';

// @ts-expect-error
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const validPackage = path.resolve(__dirname, './fixtures/valid-package.json');
const noPreconfigureForRelease = path.resolve(__dirname, './fixtures/no-prepublish-package.json');

describe('Unit > API > Configure For Release', function () {
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

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);
		const sha = 'thisisahash';

		try {
			await configureForRelease(sha, zx$);
			expect($.calledOnce).to.be.true;
			expect($.args[0][1]).to.include(sha);
			expect(chdirStub.calledOnce).to.be.true;
			expect(pathStub.calledOnce).to.be.true;
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('package.json was not changed', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3', fileList: ['packages/test/src/index.ts']}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(noPreconfigureForRelease);

		try {
			await configureForRelease('thisisahash', zx$);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('Unable to find package file');
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});
});
