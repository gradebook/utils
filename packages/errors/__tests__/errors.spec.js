// @ts-check
import {expect} from 'chai';
import {BaseError} from '../lib/errors.js';

class TestError extends BaseError {
	isTest;
	constructor(options) {
		super(Object.assign({}, options));
		this.isTest = true;
	}
}

class CloneableError extends BaseError {
	constructor(...args) {
		super(...args);
		this.state = Math.random();
	}

	clone() {
		const response = super.clone();
		response.state = this.state;
		return response;
	}
}

describe('Unit > Errors', function () {
	it('Error cloning uses the leaf constructor', function () {
		const baseError = new BaseError();
		expect(baseError.clone()).to.be.instanceOf(BaseError);

		const testError = new TestError();
		expect(testError.clone()).to.be.instanceOf(TestError);
		expect(testError.clone().isTest).to.equal(true);

		const cloneError = new CloneableError();
		expect(cloneError.clone()).to.be.instanceOf(CloneableError);
		expect(cloneError.clone().state).to.equal(cloneError.state);
	});
});
