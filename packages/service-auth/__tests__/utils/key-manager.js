// @ts-check
const jose = require('jose');
const {HASH_ALGORITHM, ENCRYPTION_ALGORITHM} = require('../../lib/constants.js');
const {KEY_ALGORITHM} = require('../../lib/constants.js');
const keys = require('../fixtures/keypair.json');

/**
 * @typedef {object} WrappedKey
 * @property {string} kid;
 * @property {Parameters<import('jose').SignJWT['sign']>[0]} key;
} */

/**
 * @param {import('jose').JWTPayload} payload
 * @param {WrappedKey} secret
 */
async function createJWE(payload, secret) {
	return new jose.SignJWT(payload)
		.setProtectedHeader({alg: HASH_ALGORITHM, enc: ENCRYPTION_ALGORITHM, kid: secret.kid})
		.setExpirationTime('6h')
		.sign(secret.key);
}

module.exports = class KeyManager {
	constructor() {
		this.selectedKey = null;
	}

	/**
	 * @param {'valid' | 'invalid' | null} type
	 */
	setKey(type) {
		switch (type) {
			case 'valid':
				this.selectedKey = this.validPublicKey;
				this.selectedKid = this.validKid;
				break;
			case 'invalid':
				this.selectedKey = this.invalidPublicKey;
				this.selectedKid = this.invalidKid;
				break;
			default:
				this.selectedKey = null;
		}
	}

	async init() {
		this.validPublicKey = await jose.importJWK(keys[0].public, KEY_ALGORITHM);
		this.validPrivateKey = await jose.importJWK(keys[0].private, KEY_ALGORITHM);
		this.invalidPublicKey = await jose.importJWK(keys[1].public, KEY_ALGORITHM);
		this.invalidPrivateKey = await jose.importJWK(keys[1].private, KEY_ALGORITHM);
		this.validKid = keys[0].kid;
		this.invalidKid = keys[1].kid;
		this.invalidJWE = await createJWE({}, {kid: this.invalidKid, key: this.invalidPrivateKey});
		this.validJWEButEmptyPayload = await createJWE({}, {kid: this.validKid, key: this.validPrivateKey});
		this.validJWEButInvalidPerms = await createJWE(
			{id: 'testing', aud: '{'}, {kid: this.validKid, key: this.validPrivateKey},
		);
		this.validJWEButInvalidPerms2 = await createJWE({
			id: 'testing', aud: '[123]',
		}, {kid: this.validKid, key: this.validPrivateKey});
		this.validJWE = await createJWE({id: 'testing', aud: ['mailer']}, {kid: this.validKid, key: this.validPrivateKey});
		this.reset();
	}

	read = async protectedHeader => {
		if (!this.selectedKey || protectedHeader.kid !== this.selectedKid) {
			this.callHistory.push(this.selectedKey ? 'MISMATCH' : 'ERROR');
			throw new Error('invalid selected key');
		}

		this.callHistory.push('SUCCESS');
		return this.selectedKey;
	};

	reset() {
		this.callHistory = [];
		this.setKey('valid');
	}
};
