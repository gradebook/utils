// @ts-check
import path from 'path';
import {fileURLToPath} from 'url';
import {expect} from 'chai';
import sinon from 'sinon';
import {publishPackage} from '../../lib/api/publish-package.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const validPackage = path.resolve(__dirname, './fixtures/valid-package.json');
const noPrepublishPackage = path.resolve(__dirname, './fixtures/no-prepublish-package.json');

/**
 * @param {(response: string) => any} actualLogic
 */
function wrapTaggedTemplateLiteral(actualLogic) {
	/**
	 * @param {string[]} strings
	 * @param {string[]} variables
	 */
	return (strings, ...variables) => {
		let response = '';

		for (const [index, string] of strings.entries()) {
			response += string;
			if (index < strings.length - 1) {
				response += variables[index];
			}
		}

		return actualLogic(response);
	};
}

function createZxStub({tag, fileList = ['packages/test/package.json']}) {
	return wrapTaggedTemplateLiteral(command => {
		if (command.startsWith('git log')) {
			return {
				stdout: fileList.join('\n')
			};
		}

		if (command.startsWith('git tag')) {
			return {
				stdout: tag
			};
		}

		if (command.startsWith('yarn publish')) {
			return {};
		}

		throw new Error(`unknown command run: ${command}`);
	});
}

describe('Unit > API > Package Publisher', function () {
	/** @type {import('sinon').SinonStub} */
	let $;

	beforeEach(function () {
		$ = sinon.stub();
	});

	it('functional case', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3'}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);

		try {
			// @ts-expect-error
			await publishPackage('thisisahash', $);
			expect($.calledThrice).to.be.true;
			expect($.args[2][1]).to.include('0.3.3');
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('tag name does not match version in package.json', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.4'}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);

		try {
			// @ts-expect-error
			await publishPackage('thisisahash', $);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('does not match with version in package.json');
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('invalid tag name', async function () {
		$.callsFake(createZxStub({tag: 'test-release'}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(validPackage);

		try {
			// @ts-expect-error
			await publishPackage('thisisahash', $);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('does not match with version in package.json');
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('no prepublish script', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3'}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(noPrepublishPackage);

		try {
			// @ts-expect-error
			await publishPackage('thisisahash', $);
			expect(false, 'An error should have been thrown').to.be.true;
		} catch (error) {
			expect(error.isReleaseUtilsError).to.be.true;
			expect(error.message).to.include('missing a prepublish script');
		} finally {
			chdirStub.restore();
			pathStub.restore();
		}
	});

	it('package.json was not changed', async function () {
		$.callsFake(createZxStub({tag: '@gradebook/test@v0.3.3', fileList: ['packages/test/src/index.ts']}));

		const chdirStub = sinon.stub(process, 'chdir');
		const pathStub = sinon.stub(path, 'resolve').returns(noPrepublishPackage);

		try {
			// @ts-expect-error
			await publishPackage('thisisahash', $);
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
