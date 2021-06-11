// @ts-check
const {expect} = require('chai');
const sinon = require('sinon');
const oid = require('bson-objectid').default;

const {importer} = require('../../lib/api.js');

describe('Unit > Importer', function () {
	it('generateAPICalls with a v0 export', function () {
		let currentID = 0;

		const stub = sinon.stub(oid.prototype, 'toHexString').callsFake(() => String(currentID++));

		try {
			expect(
				importer.generateAPICalls(require('./example-export.json'), {gid: '1243'})
			).to.deep.equal(require('./example-api-calls.json'));
		} finally {
			stub.restore();
		}
	});
});
