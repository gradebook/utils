// @ts-check
const {expect} = require('chai');
const sinon = require('sinon');
const oid = require('bson-objectid').default;

const importer = require('../lib/importer');

describe('Unit > Importer', function () {
	it('generateAPICalls with a v0 export', function () {
		let currentID = 0;

		const stub = sinon.stub(oid, 'generate').callsFake(() => String(currentID++));

		try {
			expect(
				importer.generateAPICalls(require('./test.json'), {gid: '1243'})
			).to.deep.equal(require('./test.converted.json'));
		} finally {
			stub.restore();
		}
	});
});
