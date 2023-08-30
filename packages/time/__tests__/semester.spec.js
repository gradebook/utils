// @ts-check
import {expect} from 'chai';
import {__testHelper} from '../lib/semester.js';

const {
	getFallActiveRange,
	getSpringActiveRange,
	getSummerActiveRange,
	getWinterActiveRange,
	_getPrimarySemester,
	isDateInActiveRange,
} = __testHelper();

const verifyDate = (candidate, year, month, day) => {
	expect(candidate.getFullYear(), 'year').to.equal(year);
	expect(candidate.getMonth(), 'month').to.equal(month);
	expect(candidate.getDate(), 'day').to.equal(day);
};

describe('Unit > Semester', function () {
	it('getSpringActiveRange', function () {
		verifyDate(getSpringActiveRange(2018).start, 2017, 10, 1);
		verifyDate(getSpringActiveRange(2018).end, 2018, 5, 10);
	});

	it('getSummerActiveRange', function () {
		verifyDate(getSummerActiveRange(2018).start, 2018, 2, 25);
		verifyDate(getSummerActiveRange(2018).end, 2018, 7, 31);
	});

	it('getFallActiveRange', function () {
		verifyDate(getFallActiveRange(2018).start, 2018, 2, 25);
		verifyDate(getFallActiveRange(2018).end, 2018, 11, 31);
	});

	it('getWinterActiveRange', function () {
		verifyDate(getWinterActiveRange(2018).start, 2018, 10, 1);
		verifyDate(getWinterActiveRange(2018).end, 2019, 0, 20);
	});

	it('isDateInActiveRange', function () {
		const dec1 = new Date(2017, 11, 1);
		const dec20 = new Date(2017, 11, 20);
		const dec31 = new Date(2017, 11, 31);
		const jan1 = new Date(2018, 0, 1);
		const feb1 = new Date(2018, 1, 1);

		expect(isDateInActiveRange(dec1, dec31, dec20)).to.be.true;
		expect(isDateInActiveRange(dec20, dec31, dec1)).to.be.false;
		expect(isDateInActiveRange(dec1, dec31, dec1)).to.be.true;
		expect(isDateInActiveRange(dec1, dec31, dec31)).to.be.true;
		expect(isDateInActiveRange(dec20, jan1, dec31)).to.be.true;
		expect(isDateInActiveRange(dec20, dec31, jan1)).to.be.false;
		expect(isDateInActiveRange(dec20, jan1, feb1)).to.be.false;
		expect(isDateInActiveRange(jan1, feb1, dec31)).to.be.false;
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
