// @ts-check
const {expect} = require('chai');
const {singularize} = require('../lib/commonjs/fast-pluralize');

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
			['Bonuses', 'Bonus']
		];

		plurals.forEach(([plural, singular]) => {
			expect(singularize(plural), plural).to.equal(singular);
		});
	});
});
