// @ts-check
import {IncomingMessage} from 'http';
import {expect} from 'chai';
import sinon from 'sinon';
import {domainSymbol, errorSerializer, requestSerializer, responseSerializer} from '../lib/util/serializers.js';

describe('Unit > Utils > Serializers', function () {
	it('sensitive data redaction', function () {
		// Tested with `requestSerializer`
		expect(requestSerializer({
			query: {
				pin: ['1234', '1234'], // Query strings don't normally look like this, but we're testing redaction here
				success: ['true', 'true'], // Query strings don't normally look like this, but we're testing no redaction here
			},
			headers: {
				authorization: 'Bearer abcd-1234',
				pin: { // Headers don't normally look like this, but we're testing no redaction here
					fake: true,
				},
				success: { // Headers don't normally look like this, but we're testing no redaction here
					real: true,
					deep: ['true', 'true'],
				},
				'x-be-random': [{
					value: true,
				}],
			},
		})).to.deep.equal({
			query: {pin: '**REDACTED**', success: ['true', 'true']},
			headers: {
				authorization: '**REDACTED**', pin: '**REDACTED**', success: {real: true, deep: ['true', 'true']},
				'x-be-random': [{value: true}],
			},
		});
	});

	describe('requestSerializer', function () {
		it('normal use case', function () {
			expect(requestSerializer('Request')).to.equal('Request');
			/** @type {Record<string, unknown>} */
			// @ts-expect-error
			const request = new IncomingMessage(null);
			request.responseTime = '3ms';
			request.url = '/api/v0/health';
			request.method = 'GET';

			expect(requestSerializer(request)).to.deep.equal({
				url: '/api/v0/health',
				method: 'GET',
				headers: {},
			});

			request.headers = {
				'user-agent': 'something',
			};

			expect(requestSerializer(request)).to.deep.equal({
				url: '/api/v0/health',
				method: 'GET',
				headers: {'user-agent': 'something'},
			});
		});

		it('weird header shape', function () {
			expect(requestSerializer({headers: 'true'})).to.deep.equal({headers: 'true'});
		});
	});

	describe('responseSerializer', function () {
		it('weird shape', function () {
			expect(responseSerializer('hello, world')).to.equal('hello, world');
		});

		it('normal use case', function () {
			expect(responseSerializer({
				getHeaders: () => ({header1: 'value', pin: 'test'}),
				headers: {unexpected: true}, // We expect `getHeaders` to be preferred over `headers`
				statusCode: 200,
			})).to.deep.equal({
				headers: {header1: 'value', pin: '**REDACTED**'},
				status: 200,
			});
		});

		it('weird headers', function () {
			expect(responseSerializer({
				headers: {header1: 'value', pin: 'test'},
			})).to.deep.equal({
				status: undefined,
				headers: {header1: 'value', pin: '**REDACTED**'},
			});

			expect(responseSerializer({})).to.deep.equal({
				status: undefined,
				headers: null,
			});
		});
	});

	describe('errorSerializer', function () {
		it('normal use case', function () {
			/** @type {Record<string, any>} */
			const error = new Error('Something happened');
			error.name = 'InternalServerError';
			error.help = 'Contact support';

			expect(errorSerializer(error)).to.deep.equal({
				message: error.message,
				name: 'InternalServerError',
				help: JSON.stringify(error.help),
				stack: error.stack,
			});

			expect(errorSerializer.call({[domainSymbol]: 'test'}, error)).to.deep.equal({
				domain: 'test',
				message: error.message,
				name: error.name,
				help: JSON.stringify(error.help),
				stack: error.stack,
			});

			error.errorType = 'NotAnInternalServerError';

			expect(errorSerializer(error)).to.deep.equal({
				message: error.message,
				name: 'NotAnInternalServerError',
				help: JSON.stringify(error.help),
				stack: error.stack,
			});

			expect(errorSerializer('fail', 0)).to.equal('[serialization recursion depth limit reached]');
		});

		it('different shapes', function () {
			expect(errorSerializer('hello, world')).to.equal('hello, world');

			const error = new Error('hello, world');
			expect(errorSerializer([error, 'test'])).to.deep.equal([
				{message: error.message, stack: error.stack, name: error.name},
				'test',
			]);
		});

		it('error causes', function () {
			expect(errorSerializer({cause: () => 'test'})).to.deep.equal({cause: 'test'});
			expect(errorSerializer({cause: sinon.stub().throws()})).to.be.empty;
			// @ts-expect-error
			const error = new Error('test', {cause: new TypeError('test')});
			expect(errorSerializer(error)).to.deep.equal({
				message: error.message,
				stack: error.stack,
				name: error.name,
				cause: {
					// @ts-expect-error
					message: error.cause.message,
					// @ts-expect-error
					name: error.cause.name,
					// @ts-expect-error
					stack: error.cause.stack,
				},
			});
		});
	});
});
