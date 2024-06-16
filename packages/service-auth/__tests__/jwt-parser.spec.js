// @ts-check
const {expect} = require('chai');
const {readJwt, IS_403} = require('../lib/jwt-parser.js');
const KeyManager = require('./utils/key-manager.js');

const keyStore = new KeyManager();

const AUD = ['mailer'];

describe('Unit > Service Auth > JWT Parser', function () {
	before(async function () {
		return keyStore.init();
	});

	beforeEach(function () {
		keyStore.reset();
	});

	it('KeyStore is dead', async function () {
		keyStore.setKey(null);
		expect(await readJwt(keyStore.read, keyStore.validJWE, AUD)).to.contain('Unable to get keys');
		expect(keyStore.callHistory).to.deep.equal(['ERROR']);
	});

	it('Invalid Signing Key', async function () {
		expect(await readJwt(keyStore.read, keyStore.invalidJWE, AUD)).to.contain('invalid JWT');
		expect(keyStore.callHistory).to.deep.equal(['MISMATCH']);
	});

	it('Signing Key Matches but unexpected payload', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWEButEmptyPayload, AUD)).to.equal(IS_403);
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS']);
	});

	it('Signing Key Matches but unexpected permissions', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWEButInvalidPerms, AUD)).to.equal(IS_403);
		expect(await readJwt(keyStore.read, keyStore.validJWEButInvalidPerms2, AUD)).to.equal(IS_403);
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS', 'SUCCESS']);
	});

	it('Fully valid', async function () {
		expect(await readJwt(keyStore.read, keyStore.validJWE, AUD)).to.deep.equal({integration: 'testing', audience: ['mailer']});
		expect(keyStore.callHistory).to.deep.equal(['SUCCESS']);
	});
});
