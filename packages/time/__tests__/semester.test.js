// @ts-check

import {expect} from 'chai';
import {Semester} from '../lib/semester.js';

describe('Unit > Semester', function () {
	it('constructor', function () {
		const blankSemester = new Semester('');
		expect(blankSemester.raw).to.be.empty;
		expect(blankSemester.year).to.be.equal(-1);
		expect(blankSemester.toString()).to.be.equal('Semesters');

		try {
			const semester = new Semester('2034FALL');
			expect(semester).to.equal('should have thrown');
		} catch (error) {
			expect(error.message).to.equal('Semester "2034FALL" is not a valid semester');
		}
	});

	it('isSemester', function () {
		expect(Semester.isSemester('2020F')).to.be.true;
		expect(Semester.isSemester('3065W')).to.be.true;
		expect(Semester.isSemester('121F')).to.be.false;
		expect(Semester.isSemester('2020R')).to.be.false;
	});

	it('parse', function () {
		const assertParsedSemester = (semesterString, year, season) => {
			const result = Semester.parse(semesterString);
			expect(result).to.not.equal(false);
			if (!result) {
				return;
			}

			expect(result.year).to.equal(year);
			expect(result.season).to.equal(season);
		};

		expect(Semester.parse('TooLongString')).to.be.false;
		expect(Semester.parse('Smol')).to.be.false;
		expect(Semester.parse('FFFFF')).to.be.false;
		assertParsedSemester('2020F', 2020, 'Fall');
		assertParsedSemester('2019S', 2019, 'Spring');
		assertParsedSemester('3069U', 3069, 'Summer');
		assertParsedSemester('2025W', 2025, 'Winter');
	});

	it('toString', function () {
		const assertSemesterToString = (semesterString, readableString, emoji = false) => {
			const result = new Semester(semesterString);
			expect(result).to.not.equal(false);
			if (!result) {
				return;
			}

			expect(result.toString(emoji)).to.equal(readableString);
		};

		assertSemesterToString('2020F', 'Fall 2020');
		assertSemesterToString('2020F', 'Fall 2020 🍁', true);
		assertSemesterToString('3069U', 'Summer 3069');
		assertSemesterToString('3069U', 'Summer 3069 ☀️', true);
	});
});
