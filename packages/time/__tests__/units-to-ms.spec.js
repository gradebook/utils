// @ts-check

const {expect} = require('chai');
const {unitsToMs} = require('../lib/units-to-ms.js');

const assert = (timeString, expectation) => expect(unitsToMs(timeString)).to.equal(expectation);

describe('Unit > ParseTime', function () {
	it('Accurately converts a time string to milliseconds', function () {
		assert('5d', 432_000_000);
		assert('8h', 28_800_000);
		assert('1d5m3h2s', 97_502_000);
	});
});
