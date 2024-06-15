// @ts-check
const {Buffer} = require('buffer');
const {expect} = require('chai');
const {AuthManager} = require('../lib/client-auth.js');

const protectedHeader = Buffer.from(
	JSON.stringify({id: 'abcd', exp: (Date.now() * 2) / 1000}),
).toString('base64');

class FakeFetch {
	constructor() {
		this.reset();
	}

	reset() {
		/**
		 * @param {string} _
		 * @param {import('node-fetch').RequestInit} __
		 * @returns {any}
		 */
		this.handler = (_, __) => {
			throw new Error('Unable to resolve');
		};

		/** @type {[url: string, options: unknown][]} */
		this.history = [];
	}

	proxy = (url, options) => {
		// @ts-expect-error
		this.history.push([url, options]);
		// @ts-expect-error
		const response = this.handler(url, options);

		return {
			ok: response !== undefined && response !== null,
			text() {
				return JSON.stringify(response);
			},
			json() {
				return response;
			},
		};
	};
}

describe('Unit > Client Auth', function () {
	const fetch = new FakeFetch();
	/** @type {AuthManager} */
	let service;

	beforeEach(function () {
		fetch.reset();
		service = new AuthManager(
			'https://client_id:client_secret@gateway.local',
			[
				['group_0_0', 'group_0_1', 'shared'],
				['group_1_0', 'group_1_1', 'group_1_2'],
				['group_2_0', 'group_2_1', 'shared'],
			],
			// @ts-expect-error
			fetch.proxy,
		);
	});

	it('requires auth in accessUrl', function () {
		const assertFailure = test => {
			try {
				const shouldFail = new AuthManager(test, [[]]);
				expect(shouldFail, 'Should have failed').to.not.be.ok;
			} catch (error) {
				expect(error.message).to.contain('authorization');
			}
		};

		assertFailure('https://gateway.local');
		assertFailure('https://abc@gateway.local');
		assertFailure('https://:abc@gateway.local');
	});

	it('getRequestInfo - caching and response', async function () {
		let tokenIndex = 0;
		let resolveIndex = 0;

		fetch.handler = url => {
			if (url.includes('token')) {
				return {token: `s${++tokenIndex}.${protectedHeader}`};
			}

			if (url.includes('resolve')) {
				return {
					__index: resolveIndex++,
					hostname: `${url.split('/').pop()}.local`,
				};
			}
		};

		let includeHostInHeader = false;

		const assertResponse = (request, resolutionNumber, hostname, tokenNumber) => request.then(response => {
			expect(response[0]).to.deep.contain({
				__index: resolutionNumber,
				hostname,
			});

			expect(response[1].headers.authorization).to.contain(` s${tokenNumber}.`);
			expect(Boolean(response[1].headers.host)).to.equal(includeHostInHeader);
		});

		// The bucket resolution for a shared service chooses the last bucket match because internally it's a basic for loop
		// The purpose of this test is to make sure that we reuse tokens/resolutions as much as possible.
		await assertResponse(service.getRequestInfo('shared', {includeHostInHeader}), 0, 'shared.local', 1);
		includeHostInHeader = true;
		await assertResponse(service.getRequestInfo('shared', {includeHostInHeader}), 0, 'shared.local', 1);
		await assertResponse(service.getRequestInfo('group_2_0'), 1, 'group_2_0.local', 1);
		expect(fetch.history).to.have.length(3);

		await assertResponse(service.getRequestInfo('group_0_0'), 2, 'group_0_0.local', 2);
		await assertResponse(service.getRequestInfo('shared'), 0, 'shared.local', 2);
		await assertResponse(service.getRequestInfo('group_2_0'), 1, 'group_2_0.local', 1);

		expect(fetch.history?.map(([url]) => url)).to.deep.equal([
			'https://gateway.local/api/v0/token',
			'https://gateway.local/api/v0/resolve/shared',
			'https://gateway.local/api/v0/resolve/group_2_0',
			'https://gateway.local/api/v0/token',
			'https://gateway.local/api/v0/resolve/group_0_0',
		]);
	});

	it('handles weird jwts', async function () {
		let payload = Buffer.from(JSON.stringify({id: 'abcd'})).toString('base64');
		fetch.handler = url => {
			if (url.includes('token')) {
				const response = {token: `s0.${payload}`};
				// Invalid json is the next example
				payload = '{valie}';
				return response;
			}
		};

		try {
			await service.getRequestInfo('shared');
			expect(false, 'should have failed').to.be.ok;
		} catch (error) {
			expect(error.message).to.include('parse expiry in JWT');
			expect(fetch.history).to.have.length(1);
		}

		try {
			await service.getRequestInfo('shared');
			expect(false, 'should have failed').to.be.ok;
		} catch (error) {
			expect(error.message).to.include('parse expiry in JWT');
			expect(fetch.history).to.have.length(2);
		}
	});

	it('handles resolution errors', async function () {
		const token = `t.${protectedHeader}`;
		/** @type {Record<string, string> | null} */
		let response = {error: 'testing'};
		fetch.handler = url => {
			if (url.includes('token')) {
				return {token};
			}

			return response;
		};

		expect(await service.getRequestInfo('shared')).to.be.null;

		response = null;
		expect(await service.getRequestInfo('shared')).to.be.null;
	});

	it('serviceFailedConnecting', async function () {
		const token = `t.${protectedHeader}`;
		let resolutionIndex = 0;

		fetch.handler = url => {
			if (url.includes('token')) {
				return {token};
			}

			return {
				__index: resolutionIndex++,
			};
		};

		// @ts-expect-error
		const [firstResolution] = await service.getRequestInfo('shared');
		expect(firstResolution).to.deep.contain({__index: 0});
		const [secondResolution] = await service.getRequestInfo('shared');
		expect(secondResolution).to.deep.contain({__index: 0});

		service.serviceFailedConnecting('shared');

		const [thirdResolution] = await service.getRequestInfo('shared');
		expect(thirdResolution).to.deep.contain({__index: 1});
	});

	it('Limits number of token retries', async function () {
		fetch.handler = () => ({error: 'failure'});
		try {
			await service.getRequestInfo('shared');
			expect(false, 'should have failed').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('Failed to get JWT');
		}
	});

	it('Fails when resolving an invalid service', async function () {
		try {
			await service.getRequestInfo('this_service_does_not_exist');
			expect(false, 'should have failed').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('service map');
		}
	});

	it('JWT fetching bails after too many failures', async function () {
		fetch.handler = () => {
			throw new Error('Something went wrong!');
		};

		try {
			await service.getRequestInfo('shared');
			expect(false, 'should have failed').to.be.ok;
		} catch (error) {
			expect(error.message).to.contain('Unable to get JWT');
		}
	});

	it('Can reconfigure the service map', async function () {
		fetch.handler = () => ({token: `t.${protectedHeader}`});
		let response = await service.getRequestInfo('group_0_0');
		try {
			await service.getRequestInfo('single_service');
			expect(false, 'Should have failed').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('single_service').and.to.contain('service map');
		}

		expect(response).to.be.ok;

		service.setServiceMap([['single_service']]);

		response = await service.getRequestInfo('single_service');
		expect(response).to.be.ok;
		// Cached case - even though it was removed, a service in the same original bucket will have a valid token
		response = await service.getRequestInfo('group_0_1');
		expect(response).to.be.ok;

		try {
			await service.getRequestInfo('group_1_0');
			expect(false, 'Should have failed').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('group_1_0').and.to.contain('service map');
		}
	});
});
