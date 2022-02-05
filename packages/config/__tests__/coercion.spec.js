// @ts-check
import {expect} from 'chai';
import {coerceToBoolean} from '../lib/coercion.js';

describe('Unit > Config > Coercion', function () {
	it('coerceToBoolean', function () {
		expect(coerceToBoolean(0)).to.be.false;
		expect(coerceToBoolean('0')).to.be.false;
		expect(coerceToBoolean(null)).to.be.false;
		expect(coerceToBoolean(undefined)).to.be.false;
		expect(coerceToBoolean('')).to.be.false;
		expect(coerceToBoolean('false')).to.be.false;
		expect(coerceToBoolean(false)).to.be.false;
		expect(coerceToBoolean(1)).to.be.true;
		expect(coerceToBoolean('1')).to.be.true;
		expect(coerceToBoolean(true)).to.be.true;
		expect(coerceToBoolean('true')).to.be.true;
	});
});
