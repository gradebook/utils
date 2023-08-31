// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import oid from 'bson-objectid';
import {importer} from '../../lib/api.js';
import {importJson} from '../../lib/shared/import-json.js';

const exampleExport = await importJson(import.meta.url, './example-export.json');
const exampleApiCalls = await importJson(import.meta.url, './example-api-calls.json');

describe('Unit > Importer', function () {
	it('generateAPICalls with a v0 export', function () {
		let currentID = 0;

		const stub = sinon.stub(oid.prototype, 'toHexString').callsFake(() => String(currentID++));

		try {
			expect(
				importer.generateAPICalls(exampleExport, {gid: '1243'}),
			).to.deep.equal(exampleApiCalls);
		} finally {
			stub.restore();
		}
	});
});
