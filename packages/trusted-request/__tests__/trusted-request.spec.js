import {expect} from 'chai';
import {allowTrustedIps, TrustedRequestError} from '../lib/trusted-request.js';

describe('Unit > Trusted Request', function () {
	it('API', function () {
		expect(allowTrustedIps).to.be.a('function');
		expect(TrustedRequestError).to.be.a('function');
		expect(Object.getPrototypeOf(TrustedRequestError)).to.equal(Error);
	});
});
