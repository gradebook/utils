// @ts-check
import {expect} from 'chai';
import {__test} from '../../lib/transport/pino-pretty.js';

const fakeResponse = (status = 404) => ({
	status,
	method: 'GET',
	url: '/',
});

const fakeError = (name = 'NotFoundError') => ({
	name,
	stack: new Error('Test').stack,
});

describe('Unit > Transports > PinoPretty', function () {
	it('Can conditionally include request error information', function () {
		let logger = __test.messageFormatWithExclude('', {});

		const fakeMessage = {
			res: fakeResponse(),
			req: fakeResponse(),
			err: fakeError(),
			responseTime: 5,
		};

		expect(logger(fakeMessage, '', ''))
			.to.not.contain('stack').and.to.not.contain('at ');

		logger = __test.messageFormatWithExclude('', {disableRequestErrorFiltering: true});

		expect(logger(fakeMessage, '', ''))
			.to.contain('at ');
	});
});
