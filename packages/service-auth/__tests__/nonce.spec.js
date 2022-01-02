// @ts-check
const {IncomingMessage} = require('http');
const {expect} = require('chai');
const {useNonce, __forTestOnlyHistory} = require('../lib/nonce.js');
const FakeResponse = require('./utils/fake-response.js');

describe('Unit > Service Auth > Nonce', function () {
	/** @type {FakeResponse & import('express').Response} */
	let fakeResponse;

	/** @type {IncomingMessage & import('express').Request} */
	let request;

	/** @type {ReturnType<typeof useNonce>} */
	let nonceCore;

	beforeEach(function () {
		for (const [index] of __forTestOnlyHistory.entries()) {
			__forTestOnlyHistory[index] = undefined;
		}

		// @ts-expect-error stubs
		request = new IncomingMessage(null);
		// @ts-expect-error stubs
		fakeResponse = new FakeResponse(request);
		nonceCore = useNonce();
	});

	it('assert fails when the header is missing', function () {
		const nonce = nonceCore.assert(request, fakeResponse);

		expect(nonce).to.not.be.ok;
		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 400,
			data: JSON.stringify({error: 'nonce is required'}),
		});
	});

	it('assert fails when nonce is reused', function () {
		nonceCore.track('0000');

		request.headers['x-gateway-nonce'] = '0000';
		const nonce = nonceCore.assert(request, fakeResponse);

		expect(nonce).to.not.be.ok;
		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 400,
			data: JSON.stringify({error: 'reused nonce'}),
		});
	});

	it('assert - passing case', function () {
		request.headers['x-gateway-nonce'] = '0000';
		const nonce = nonceCore.assert(request, fakeResponse);

		expect(fakeResponse.used).to.be.false;
		expect(nonce).to.equal('0000');
	});

	it('has a maximum size', function () {
		/** @type {typeof fakeResponse} */
		// @ts-expect-error
		const secondaryResponse = new FakeResponse(request);

		for (let i = 0; i < 128; ++i) {
			const nonce = String(i).repeat(4);
			request.headers['x-gateway-nonce'] = nonce;
			expect(nonceCore.assert(request, fakeResponse)).to.equal(nonce);
			nonceCore.track(nonce);
		}

		request.headers['x-gateway-nonce'] = '0000';
		expect(nonceCore.assert(request, secondaryResponse)).to.not.be.ok;
		expect(secondaryResponse).to.deep.contain({
			used: true,
			statusCode: 400,
		});

		nonceCore.track('5555');
		expect(nonceCore.assert(request, fakeResponse)).to.equal('0000');
	});
});
