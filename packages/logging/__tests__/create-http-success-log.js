// @ts-check
import {IncomingMessage, ServerResponse} from 'http';
import {expect} from 'chai';
import {green, cyan, yellow, red} from 'colorette';
import {createSuccessMessage} from '../lib/util/create-http-success-log.js';

describe('Unit > Utils > Create HTTP Success Log', function () {
	it('normal case', function () {
		// @ts-expect-error
		const request = new IncomingMessage(null);
		request.method = 'GET';
		request.url = '/api/v0/health';

		const response = new ServerResponse(request);

		expect(createSuccessMessage(request, response, 12)).to.equal('"GET /api/v0/health" 200 12ms');
	});

	it('status colors', function () {
		const doTest = (status, colorFunc) => {
			// @ts-expect-error
			expect(createSuccessMessage({method: 'GET', url: '/'}, {status}, 12, true))
				.to.equal(`"GET /" ${colorFunc(status)} 12ms`);
		};

		doTest(100, x => x);
		doTest(200, green);
		doTest(300, cyan);
		doTest(400, yellow);
		doTest(500, red);
	});
});
