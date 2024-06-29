// @ts-check

import {expect} from 'chai';
import {readableSemester} from '../lib/readable-semester.js';

const assert = (semesterString, year, season) => {
	const result = readableSemester(semesterString);
	expect(result.year).to.equal(year);
	expect(result.season).to.equal(season);
};

describe('Unit > ReadableSemester', function () {
	it('Accurately splits semester code to readable format', function () {
		assert('2020F', '2020', 'Fall');
		assert('2019S', '2019', 'Spring');
		assert('3069U', '3069', 'Summer');
		assert('2025W', '2025', 'Winter');
	});
});
