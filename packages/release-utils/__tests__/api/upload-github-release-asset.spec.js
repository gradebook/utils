// @ts-check
import {fileURLToPath} from 'url';
import {expect} from 'chai';
import sinon from 'sinon';
import {__testDependencyInjector, makeGitHubRequest} from '../../lib/api/github.js';
import {uploadGitHubReleaseAssets} from '../../lib/api/upload-github-release-asset.js';

// @ts-expect-error
const ASSET_PATH = fileURLToPath(new URL('./fixtures/changelog-fake.md', import.meta.url));

describe('Unit > API > Package Publisher', function () {
	/** @type {import('sinon').SinonStub} */
	let fetchStub;
	/** @type {import('sinon').SinonStub} */
	let json;

	beforeEach(function () {
		fetchStub = sinon.stub();
		json = sinon.stub();
		fetchStub.resolves({json, ok: true});

		// @ts-expect-error
		__testDependencyInjector(fetchStub);
	});

	it('makeGitHubRequest', async function () {
		const mainHeaders = {
			accept: 'application/vnd.github.v3+json',
			authorization: 'Bearer AUTH_TOKEN',
		};

		const exampleHeader = {'x-test-header': 'true'};

		await makeGitHubRequest('u1', 'AUTH_TOKEN', {});
		await makeGitHubRequest('u2', 'AUTH_TOKEN', {headers: exampleHeader});

		expect(fetchStub.args).to.deep.equal([
			['u1', {headers: mainHeaders}],
			['u2', {headers: {...mainHeaders, ...exampleHeader}}],
		]);
		expect(json.calledTwice).to.be.true;
	});

	describe('uploadGitHubReleaseAsset', function () {
		it('Correctly coerces string asset to string[]', async function () {
			json.resolves({upload_url: 'a_string'}); // eslint-disable-line camelcase
			await uploadGitHubReleaseAssets({
				ownerAndRepository: 'gradebook/test-repo',
				tagName: 'test-tag',
				token: 'AUTH_TOKEN',
			}, ASSET_PATH);

			expect(fetchStub.calledTwice).to.be.true;
		});
	});
});
