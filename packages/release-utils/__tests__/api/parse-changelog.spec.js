import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import chai from 'chai';
import getLastRelease from '../../lib/api/parse-changelog.js';

const {expect} = chai;
const dirname = path.dirname(fileURLToPath(import.meta.url));

async function readChangelog(name) {
	const absolutePath = path.resolve(dirname, `./fixtures/changelog-${name}.md`);
	return readFile(absolutePath, 'utf8');
}

describe('Unit > API > Parse Changelog', function () {
	it('minimal changelog', async function () {
		const contents = await readChangelog('minimal');

		expect(getLastRelease(contents)).to.deep.equal({
			version: 'v0.9.1',
			notes: ' - Fix a bug\n - Fix another bug',
		});
	});

	it('with unreleased', async function () {
		const contents = await readChangelog('unreleased');

		expect(getLastRelease(contents)).to.deep.equal({
			version: 'v0.1.1',
			notes: ' - Fix a bug\n - Fix the other bug',
		});
	});

	it('with links', async function () {
		const contents = await readChangelog('links');

		expect(getLastRelease(contents)).to.deep.equal({
			version: 'v4.0.1',
			notes: ' - Fix a bug\n - Fix that other bug',
		});
	});

	it('not a real changelog', async function () {
		const contents = await readChangelog('not-really');

		try {
			getLastRelease(contents);
			expect(false, 'should have throw').to.be.true;
		} catch (error) {
			expect(error.message).to.equal('Unable to extract release notes');
		}
	});

	it('just a text doc', async function () {
		const contents = await readChangelog('fake');

		try {
			getLastRelease(contents);
			expect(false, 'should have throw').to.be.true;
		} catch (error) {
			expect(error.message).to.equal('Unable to extract release notes');
		}
	});
});
