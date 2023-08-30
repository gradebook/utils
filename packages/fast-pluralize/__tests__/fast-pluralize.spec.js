// @ts-check
import {expect} from 'chai';
import {singularize} from '../lib/fast-pluralize.js';

describe('Unit > Singularize', function () {
	it('Singular-plural pairs', function () {
		const plurals = [
			['Quizzes', 'Quiz'],
			['Assignments', 'Assignment'],
			['Lab Reports', 'Lab Report'],
			['Class Exercises', 'Class Exercise'],
			['Journals', 'Journal'],
			['Essays', 'Essay'],
			['Cases', 'Case'],
			['Analysis', 'Analysis'],
			['Activities', 'Activity'],
			['Bonuses', 'Bonus'],
		];

		for (const [plural, singular] of plurals) {
			expect(singularize(plural), plural).to.equal(singular);
		}
	});
});
