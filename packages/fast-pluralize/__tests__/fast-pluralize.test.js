import {expect} from 'chai';
import {singularize} from '../lib/fast-pluralize';

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
			['Activities', 'Activity']
		];

		plurals.forEach(([plural, singular]) => {
			expect(singularize(plural)).to.equal(singular);
		});
	});
});
