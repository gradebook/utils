// @ts-check
import path from 'path';
import process from 'process';
import {fileURLToPath} from 'url';
import {expect} from 'chai';
import sinon from 'sinon';
import {configureForRelease} from '../../lib/api/configure-for-release.js';
import {createZxStub} from '../utils/zx-stub.js';
import {convertSinonStubToZX} from '../utils/cast-sinon-to-zx.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const validPackage = path.resolve(__dirname, './fixtures/valid-package.json');
const noPreconfigureForRelease = path.resolve(__dirname, './fixtures/no-prepublish-package.json');

describe('Unit > API > Configure For Release', function () {
	/** @type {import('sinon').SinonStub} */
	let $;
	/** @type {import('zx').$} */
	let zx$;

	before(function () {
		sinon.stub(process, 'exit').throws();
	});

	beforeEach(function () {
		$ = sinon.stub();
		zx$ = convertSinonStubToZX($);
	});

	after(function () {
		sinon.restore();
	});

	it('functional case', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3'}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);
		const sha = 'thisisahash';

		try {
			const {isMergeRef} = await configureForRelease(sha, zx$);
			expect($.calledTwice).to.be.true;
			expect($.args[1][1]).to.include(sha);
			expect($.args[1][1]).to.not.include('^@');
			expect(isMergeRef).to.be.false;
			expect(chdirStub.calledOnce).to.be.true;
			expect(pathStub.calledOnce).to.be.true;
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('merge commit', async function () {
		// Gradebook Server
		$.callsFake(createZxStub({
			tag: 'v4.8.11',
			revList: [
				'3df44b2bbb5f6d4a76dd1d3e08652dab2a0e699e',
				'd8c6e3d43d18aaec0f0fa2ac9b7f7d8f2d465336',
				'8bfe8e4d9707ffcf64aca957e4e29b91a65a022a',
			]},
		));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);

		try {
			const {isMergeRef} = await configureForRelease('', zx$);
			expect($.calledTwice).to.be.true;
			expect($.args[1][1]).to.include('^@');
			expect(isMergeRef).to.be.true;
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
