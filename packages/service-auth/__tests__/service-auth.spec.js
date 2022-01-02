// @ts-check
const {IncomingMessage} = require('http');
const {expect} = require('chai');
const sinon = require('sinon');
const {__forTestOnlyHistory} = require('../lib/nonce.js');
const {useServiceAuth, resolvePaths} = require('../lib/service-auth.js');
const FakeResponse = require('./utils/fake-response.js');
const KeyManager = require('./utils/key-manager.js');

const keyStore = new KeyManager();

describe('Unit > Service Auth', function () {
	/** @type {FakeResponse & import('express').Response} */
	let fakeResponse;

	/** @type {IncomingMessage & import('express').Request} */
	let request;

	/** @type {ReturnType<typeof useServiceAuth>} */
	let authenticate;

	before(function () {
		return keyStore.init();
	});

	beforeEach(function () {
		for (const [index] of __forTestOnlyHistory.entries()) {
			__forTestOnlyHistory[index] = undefined;
		}

		keyStore.reset();
		// @ts-expect-error stubs
		request = new IncomingMessage(null);
		// @ts-expect-error stubs
		fakeResponse = new FakeResponse(request);
		authenticate = useServiceAuth({
			store: keyStore.read,
			serviceName: 'mailer',
		});
	});

	it('Resolver handles subpaths', function () {
		const base = 'http://127.0.0.1/base';

		expect(resolvePaths(base, '/api/').toString()).to.equal('http://127.0.0.1/base/api/');
		expect(resolvePaths(base, './api/').toString()).to.equal('http://127.0.0.1/base/api/');
		expect(resolvePaths(base, 'api').toString()).to.equal('http://127.0.0.1/base/api');
		expect(resolvePaths(base, './api').toString()).to.equal('http://127.0.0.1/base/api');
	});

	it('Header is not provided / is invalid', async function () {
		const doesNotThrow = sinon.stub().throws();
		authenticate(request, fakeResponse, doesNotThrow);
		let nonceIndex = 0;

		const assertInvalid = async () => {
			fakeResponse.__reset();
			request.headers['x-gateway-nonce'] = `000${nonceIndex++}`;
			await authenticate(request, fakeResponse, doesNotThrow);
			expect(fakeResponse).to.deep.contain({
				used: true,
				statusCode: 400,
				data: JSON.stringify({error: 'invalid authorization header'}),
			});
		};

		await assertInvalid();

		request.headers.authorization = 'bearer does-not-matter';
		await assertInvalid();

		request.headers.authorization = 'Bearer token what';
		await assertInvalid();

		expect(doesNotThrow.called).to.be.false;
	});

	it('Invalid JWT', async function () {
		const doesNotThrow = sinon.stub().throws();

		request.headers.authorization = 'Bearer this.is.not.a.jwt';
		request.headers['x-gateway-nonce'] = '0000';
		await authenticate(request, fakeResponse, doesNotThrow);

		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 401,
			data: JSON.stringify({error: 'Unable to get keys from Gateway, or invalid JWT'}),
		});
	});

	it('Permission mismatch', async function () {
		const doesNotThrow = sinon.stub().throws();
		authenticate = useServiceAuth({
			store: keyStore.read,
			serviceName: 'not_mailer',
			requireNonce: false,
		});

		request.headers.authorization = `Bearer ${keyStore.validJWE}`;
		request.headers['x-gateway-nonce'] = '0000';
		await authenticate(request, fakeResponse, doesNotThrow);

		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 403,
			data: JSON.stringify({error: 'Access denied'}),
		});
	});

	it('Requires nonce by default', async function () {
		const shouldBeCalled = sinon.stub();

		request.headers.authorization = `Bearer ${keyStore.validJWE}`;
		await authenticate(request, fakeResponse, shouldBeCalled);

		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 400,
			data: JSON.stringify({error: 'nonce is required'}),
		});
	});

	it('Normal operation', async function () {
		const shouldBeCalled = sinon.stub();

		request.headers.authorization = `Bearer ${keyStore.validJWE}`;
		request.headers['x-gateway-nonce'] = '0000';
		await authenticate(request, fakeResponse, shouldBeCalled);

		expect(fakeResponse.used).to.be.false;
		expect(shouldBeCalled.calledOnce).to.be.true;
	});

	it('Normal operation (no nonce needed)', async function () {
		const shouldBeCalled = sinon.stub();

		authenticate = useServiceAuth({
			store: keyStore.read,
			serviceName: 'not_mailer',
			requireNonce: false,
		});

		request.headers.authorization = `Bearer ${keyStore.validJWE}`;
		await authenticate(request, fakeResponse, shouldBeCalled);

		expect(fakeResponse).to.deep.contain({
			used: true,
			statusCode: 403,
			data: JSON.stringify({error: 'Access denied'}),
		});
	});
});
