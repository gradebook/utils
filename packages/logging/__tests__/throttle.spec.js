// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import {createThrottler} from '../lib/util/throttle.js';

describe('Unit > Util > Throttle', function () {
	/** @type {ReturnType<sinon['useFakeTimers']>} */
	let timer;

	beforeEach(function () {
		timer = sinon.useFakeTimers();
	});

	afterEach(function () {
		sinon.restore();
	});

	it('1 minute - exact', function () {
		const throttle = createThrottler(60_000);
		expect(throttle()).to.be.true;
		expect(throttle()).to.be.false;
		timer.tick(60_000);
		expect(throttle()).to.be.true;
		expect(throttle()).to.be.false;
	});

	it('10 minutes - approximate', function () {
		const throttle = createThrottler(600_000);
		expect(throttle()).to.be.true;
		expect(throttle()).to.be.false;
		timer.tick(599_999);
		expect(throttle()).to.be.false;
		timer.tick(1);
		expect(throttle()).to.be.true;
		expect(throttle()).to.be.false;
		timer.tick(600_001);
		expect(throttle()).to.be.true;
		expect(throttle()).to.be.false;
	});
});
