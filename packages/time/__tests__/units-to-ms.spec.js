// @ts-check

const {expect} = require('chai');
const {unitsToMs} = require('../lib/units-to-ms');

const assert = (timeString, expectation) => expect(unitsToMs(timeString)).to.equal(expectation);

describe('Unit > ParseTime', function () {
	it('Accurately converts a time string to milliseconds', function () {
		assert('5d', 432000000);
		assert('8h', 28800000);
		assert('1d5m3h2s', 97502000);
	});
});
