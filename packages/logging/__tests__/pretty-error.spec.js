// @ts-check
import {expect} from 'chai';
import {prettyError} from '../lib/util/pretty-error.js';

const DIVIDER = '----------------------------------------';

const id = 'aa-bb-cc-dd-ee-ff';
const ID = `Error ID: ${id}`;

const stack = 'Message\n\tat xx:1:1\n\tat yy:2:2';

/**
 * @param {any} error
 * @param {any[]} lines
 */
const assertResponse = (error, lines) => {
	expect(prettyError(error, false)).to.equal(lines.join('\n'));
};

describe('Unit > Util > PrettyError', function () {
	it('Fake error', function () {
		const error = {message: 'Hello, world!', stack};
		const lines = [
			error.message,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];

		assertResponse(error, lines);
	});

	it('Error object', function () {
		const error = new Error('Test error');
		const lines = [
			error.message,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with a type', function () {
		const error = {id, message: 'Nothing to see here', errorType: 'NotFoundError', stack};
		const lines = [
			`Type: ${error.errorType}`,
			error.message,
			'',
			ID,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with context', function () {
		const error = {id, message: 'I did something bad', context: 'what do you expect, no supervision!', stack};
		const lines = [
			error.message,
			'',
			error.context,
			'',
			ID,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with help', function () {
		const error = {id, message: 'You did something wrong', stack, help: 'Try doing something right'};
		const lines = [
			error.message,
			'',
			`${error.help}`,
			'',
			ID,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with code', function () {
		const error = {id, message: 'Not found', errorType: 'NotFoundError', stack, code: 404};
		const lines = [
			`Type: ${error.errorType}`,
			error.message,
			'',
			ID,
			'',
			`Error Code: ${error.code}`,
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with simple details', function () {
		const error = {id, message: 'SQL is hard', stack, errorDetails: 'did something wrong'};
		const lines = [
			error.message,
			'',
			ID,
			'',
			'Details:',
			`"${error.errorDetails}"`,
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with json details', function () {
		const error = {id, message: 'SQL is hard', stack, errorDetails: {error: 'syntax error'}};
		const lines = [
			error.message,
			'',
			ID,
			'',
			'Details:',
			JSON.stringify(error.errorDetails, null, 2),
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with json (string) details', function () {
		const error = {id, message: 'SQL is hard', stack, errorDetails: JSON.stringify({error: 'syntax error'})};
		const lines = [
			error.message,
			'',
			ID,
			'',
			'Details:',
			JSON.stringify(JSON.parse(error.errorDetails), null, 2),
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('with array (string) details', function () {
		const errorDetails = JSON.stringify([{error: 'syntax error'}, {test: false}]);
		const error = {id, message: 'SQL is hard', stack, errorDetails};
		const lines = [
			error.message,
			'',
			ID,
			'',
			'Details:',
			JSON.stringify(JSON.parse(error.errorDetails)[0], null, 2),
			'',
			DIVIDER,
			'',
			error.stack,
			'',
		];
		assertResponse(error, lines);
	});

	it('hide the stack', function () {
		const error = {id, message: 'You did something wrong', stack, help: 'Try doing something right', hideStack: true};
		const lines = [
			error.message,
			'',
			`${error.help}`,
			'',
			ID,
			'',
			'',
		];
		assertResponse(error, lines);
	});

	it('full error with colors', function () {
		const error = {
			id,
			errorType: 'SuperDuperError',
			message: 'Very nice error indeed',
			stack,
			context: JSON.stringify({a: 'The best test'}),
			help: 'An apple a day keeps the doctor away!',
			code: 418,
			errorDetails: {
				long: true,
			},
		};

		const colorClose = '\u001B[39m';
		const colorCyan = '\u001B[36m';
		const colorYellow = '\u001B[33m';
		const colorWhite = '\u001B[37m';
		const colorWhiteBright = '\u001B[97m';
		const colorGray = '\u001B[90m';

		const lines = [
			colorCyan + `Type: ${error.errorType}` + colorClose,
			colorCyan + error.message + colorClose,
			'',
			colorWhite + error.context + colorClose,
			colorYellow + error.help + colorClose,
			'',
			colorWhiteBright + 'Error ID: ' + colorClose + colorGray + id + colorClose,
			'',
			colorWhiteBright + 'Error Code: ' + colorClose + colorGray + error.code + colorClose,
			colorWhiteBright + 'Details:' + colorClose,
			colorGray + JSON.stringify(error.errorDetails, null, 2) + colorClose,
			'',
			colorGray + DIVIDER + colorClose,
			'',
			colorGray + stack + colorClose,
			'',
		];

		// @ts-expect-error
		expect(prettyError(error, true)).to.equal(lines.join('\n'));
	});
});
