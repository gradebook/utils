// @ts-check

import {expect} from 'chai';
import Semester from '../lib/semester.js';

const verifyReadable = (semesterString, year, season) => {
	const result = Semester.parse(semesterString);
	expect(result).to.not.be.an('boolean');
	if (result) {
		expect(result.year).to.equal(year);
		expect(result.season).to.equal(season);
	}
};

const verifyString = (semesterString, readableString, emoji = false) => {
	const result = new Semester(semesterString);
	expect(result).to.not.be.an('boolean');
	if (result) {
		expect(result.toString(emoji)).to.equal(readableString);
	}
};

describe('Unit > Semester', function () {
	it('constructor', function () {
		const blankSemester = new Semester('');
		expect(blankSemester.raw).to.be.empty;
		expect(blankSemester.year).to.be.equal(-1);
		expect(blankSemester.toString()).to.be.equal('Semesters');

		expect(function () {
			// eslint-disable-next-line no-new
			new Semester('2034FALL');
		}).to.throw('Semester "2034FALL" is not a valid semester');
	});

	it('isSemester', function () {
		expect(Semester.isSemester('2020F')).to.be.true;
		expect(Semester.isSemester('3065W')).to.be.true;
		expect(Semester.isSemester('121F')).to.be.false;
		expect(Semester.isSemester('2020R')).to.be.false;
	});

	it('parse', function () {
		expect(Semester.parse('TooLongString')).to.be.false;
		expect(Semester.parse('Smol')).to.be.false;
		expect(Semester.parse('FFFFF')).to.be.false;
		verifyReadable('2020F', 2020, 'Fall');
		verifyReadable('2019S', 2019, 'Spring');
		verifyReadable('3069U', 3069, 'Summer');
		verifyReadable('2025W', 2025, 'Winter');
	});

	it('toString', function () {
		verifyString('2020F', 'Fall 2020');
		verifyString('2020F', 'Fall 2020 🍁', true);
		verifyString('3069U', 'Summer 3069');
		verifyString('3069U', 'Summer 3069 ☀️', true);
	});
});
