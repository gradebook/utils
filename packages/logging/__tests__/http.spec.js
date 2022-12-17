// @ts-check
import {IncomingMessage} from 'http';
import {expect} from 'chai';
import sinon from 'sinon';
import {createIgnore, useHttpLogging} from '../lib/http.js';

const createIncomingMessage = overrides => {
	// @ts-expect-error
	const message = new IncomingMessage(null);
	Object.assign(message, overrides);
	return message;
};

/**
 * @param {Record<string, any>} overrides
 * @returns {import('../lib/config.js').LoggingOptions}
 */
// @ts-expect-error
const partialOptions = overrides => Object.assign({}, overrides);

describe('Unit > HTTP', function () {
	it('createIgnore', function () {
		const MATCH = '/api/v0/health';
		const NOMATCH = '/api/v0/health/check';
		const throttler = sinon.stub().returns(false); // Never throttled
		const ignore = createIgnore(throttler, MATCH);

		expect(
			ignore(createIncomingMessage({url: NOMATCH})),
			'Path does not match',
		).to.be.false;
		expect(throttler.called, 'Throttler is bypassed when path does not match').to.be.false;

		expect(
			ignore(createIncomingMessage({url: MATCH})),
			'Path matches',
		).to.be.true;
		expect(throttler.called, 'Throttler is called when path matches').to.be.true;

		// Priority check for different paths
		expect(ignore(createIncomingMessage({path: MATCH, url: NOMATCH, originalUrl: NOMATCH}))).to.be.true;
		expect(ignore(createIncomingMessage({path: NOMATCH, url: MATCH, originalUrl: MATCH}))).to.be.false;
		expect(ignore(createIncomingMessage({url: MATCH, originalUrl: NOMATCH}))).to.be.false;
		expect(ignore(createIncomingMessage({url: NOMATCH, originalUrl: MATCH}))).to.be.true;
	});

	it('useHttpLogging', function () {
		/** @type {import('pino').Logger} */
		// @ts-expect-error
		const logger = {};
		const pinoHttp = sinon.stub();

		useHttpLogging(logger, partialOptions({healthcheck: null}), pinoHttp);
		useHttpLogging(logger, partialOptions({healthcheck: {path: '', intervalInMinutes: 5}}), pinoHttp);
		expect(Object.keys(pinoHttp.args[0][0])).to.deep.equal([
			'logger', 'genReqId', 'customSuccessMessage', 'wrapSerializers', 'serializers',
		]);

		expect(Object.keys(pinoHttp.args[1][0])).to.deep.equal([
			'logger', 'genReqId', 'customSuccessMessage', 'wrapSerializers', 'serializers', 'autoLogging',
		]);

		expect(pinoHttp.args[1][0].genReqId()).to.be.a('string');
		expect(pinoHttp.args[1][0].customSuccessMessage()).to.equal('');
	});
});
