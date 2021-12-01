// @ts-check
const rewire = require('rewire');
const {expect} = require('chai');

const semester = rewire('../lib/semester');

const isSpringAllowed = semester.__get__('isSpringAllowed');
const isSummerAllowed = semester.__get__('isSummerAllowed');
const isFallAllowed = semester.__get__('isFallAllowed');
const isWinterAllowed = semester.__get__('isWinterAllowed');
const getActiveSemester = semester.__get__('_getActiveSemester');

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

	it('_getActiveSemester', function () {
		expect(getActiveSemester(1, 1, 2020)).to.equal('2019W');
		expect(getActiveSemester(1, 9, 2020)).to.equal('2019W');
		expect(getActiveSemester(1, 10, 2020)).to.equal('2020S');
		expect(getActiveSemester(1, 15, 2020)).to.equal('2020S');
		expect(getActiveSemester(3, 15, 2020)).to.equal('2020S');
		expect(getActiveSemester(5, 25, 2020)).to.equal('2020S');
		expect(getActiveSemester(5, 26, 2020)).to.equal('2020U');
		expect(getActiveSemester(7, 19, 2020)).to.equal('2020U');
		expect(getActiveSemester(8, 10, 2020)).to.equal('2020U');
		expect(getActiveSemester(8, 11, 2020)).to.equal('2020F');
		expect(getActiveSemester(11, 11, 2020)).to.equal('2020F');
		expect(getActiveSemester(12, 20, 2020)).to.equal('2020F');
		expect(getActiveSemester(12, 21, 2020)).to.equal('2020W');
		expect(getActiveSemester(12, 31, 2020)).to.equal('2020W');
	});
});
