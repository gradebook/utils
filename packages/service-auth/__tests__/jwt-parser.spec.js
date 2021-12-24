// @ts-check
const {expect} = require('chai');
const {readJwt} = require('../lib/jwt-parser.js');
const KeyManager = require('./utils/key-manager.js');

const keyStore = new KeyManager();

describe('Unit > Service Auth > JWT Parser', function () {
	before(async function () {
		return keyStore.init();
	});

	beforeEach(function () {
		keyStore.reset();
	});

	it('KeyStore is dead', async function () {
		keyStore.setKey(null);
		expect(await readJwt(keyStore.read, keyStore.validJWE)).to.contain('Unable to get keys');
		expect(keyStore.callHistory).to.deep.equal(['ERROR']);
	});

	it('Invalid Signing Key', async function () {
		expect(await readJwt(keyStore.read, keyStore.invalidJWE)).to.contain('invalid JWT');
		expect(keyStore.callHistory).to.deep.equal(['MISMATCH']);
	});

	it('Signing Key Matches but unexpected payload', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWEButEmptyPayload)).to.contain('Invalid JWT');
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS']);
	});

	it('Signing Key Matches but unexpected permissions', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWEButInvalidPerms)).to.contain('Failed parsing perm');
		expect(await readJwt(keyStore.read, keyStore.validJWEButInvalidPerms2)).to.contain('Failed parsing perm');
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS', 'SUCCESS']);
	});

	it('Fully valid', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWE)).to.deep.equal({
			integration: 'testing',
			permissions: ['mailer'],
		});
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS']);
	});
});
