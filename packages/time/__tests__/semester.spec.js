// @ts-check
import {expect} from 'chai';

import {__testHelper} from '../lib/semester.js';

const {
	isSpringAllowed,
	isSummerAllowed,
	isFallAllowed,
	isWinterAllowed,
	_getPrimarySemester,
} = __testHelper();

describe('Unit > Semester', function () {
	it('isSpringAllowed', function () {
		expect(isSpringAllowed(12, 14, 2019)).to.equal(null);
		expect(isSpringAllowed(12, 15, 2019)).to.equal('2020S');
		expect(isSpringAllowed(1, 5, 2020)).to.equal('2020S');
		expect(isSpringAllowed(3, 15, 2020)).to.equal('2020S');
		expect(isSpringAllowed(6, 15, 2020)).to.equal('2020S');
		expect(isSpringAllowed(6, 16, 2020)).to.equal(null);
	});

	it('isSummerAllowed', function () {
		expect(isSummerAllowed(4, 30, 2020)).to.equal(null);
		expect(isSummerAllowed(5, 1, 2020)).to.equal('2020U');
		expect(isSummerAllowed(7, 15, 2020)).to.equal('2020U');
		expect(isSummerAllowed(8, 31, 2020)).to.equal('2020U');
		expect(isSummerAllowed(9, 1, 2020)).to.equal(null);
	});

	it('isFallAllowed', function () {
		expect(isFallAllowed(7, 31, 2020)).to.equal(null);
		expect(isFallAllowed(8, 1, 2020)).to.equal('2020F');
		expect(isFallAllowed(10, 15, 2020)).to.equal('2020F');
		expect(isFallAllowed(12, 28, 2020)).to.equal('2020F');
		expect(isFallAllowed(12, 29, 2020)).to.equal(null);
	});

	it('isWinterAllowed', function () {
		expect(isWinterAllowed(11, 30, 2020)).to.equal(null);
		expect(isWinterAllowed(12, 1, 2020)).to.equal('2020W');
		expect(isWinterAllowed(12, 25, 2020)).to.equal('2020W');
		expect(isWinterAllowed(1, 15, 2021)).to.equal('2020W');
		expect(isWinterAllowed(1, 31, 2021)).to.equal('2020W');
		expect(isWinterAllowed(2, 1, 2021)).to.equal(null);
	});

	it('_getPrimarySemester', function () {
		expect(_getPrimarySemester(0, 1, 2020)).to.equal('2019W');
		expect(_getPrimarySemester(0, 9, 2020)).to.equal('2019W');
		expect(_getPrimarySemester(0, 10, 2020)).to.equal('2020S');
		expect(_getPrimarySemester(0, 15, 2020)).to.equal('2020S');
		expect(_getPrimarySemester(2, 15, 2020)).to.equal('2020S');
		expect(_getPrimarySemester(4, 27, 2020)).to.equal('2020S');
		expect(_getPrimarySemester(4, 28, 2020)).to.equal('2020U');
		expect(_getPrimarySemester(6, 19, 2020)).to.equal('2020U');
		expect(_getPrimarySemester(7, 16, 2020)).to.equal('2020U');
		expect(_getPrimarySemester(7, 17, 2020)).to.equal('2020F');
		expect(_getPrimarySemester(10, 11, 2020)).to.equal('2020F');
		expect(_getPrimarySemester(11, 20, 2020)).to.equal('2020F');
		expect(_getPrimarySemester(11, 21, 2020)).to.equal('2020W');
		expect(_getPrimarySemester(11, 31, 2020)).to.equal('2020W');
	});
});
