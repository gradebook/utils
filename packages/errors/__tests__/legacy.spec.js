// @ts-check
import assert from 'node:assert';
import {expect} from 'chai';
import * as errors from '../lib/errors.js';
import * as utils from '../lib/utils.js';

describe('Error Utils', function () {
	describe('Utils', function () {
		describe('prepareStackForUser', function () {
			it('returns full error clone of nested errors', function () {
				const originalError = new Error('I am the original one!');
				const ghostError = new errors.ValidationError({
					message: 'mistakes were made',
					help: 'help yourself',
					errorDetails: {
						originalError,
					},
				});

				const processedError = utils.prepareStackForUser(ghostError, false);

				assert.notEqual(processedError, ghostError);
				expect(ghostError.stack).to.not.equal(processedError.stack);
				// Stack is not enumerable so we don't need to delete it from the objects
				expect(processedError).to.deep.equal(ghostError);

				originalError.message = 'changed';
				assert.notEqual(processedError.message, originalError.message);
			});

			// Not part of original test suite
			it('can process native errors', function () {
				const originalError = new Error('I am the original one!');
				const processedError = utils.prepareStackForUser(originalError, false);

				assert.notEqual(processedError, originalError);
				expect(originalError.stack).to.not.equal(processedError.stack);
				// Stack is not enumerable so we don't need to delete it from the objects
				expect(processedError).to.deep.equal(originalError);

				originalError.message = 'changed';
				assert.notEqual(processedError.message, originalError.message);
			});

			it('Preserves the stack trace', function () {
				const errorCreatingFunction = () => new Error('Original error');

				const originalError = errorCreatingFunction();
				const ghostError = new errors.EmailError({
					message: 'Ghost error',
					err: originalError,
				});

				assert.equal(ghostError.stack?.includes('errorCreatingFunction'), true);
			});
		});
	});

	describe('Errors', function () {
		it('Ensure we inherit from Error', function () {
			const ghostError = new errors.InternalServerError();
			expect((ghostError instanceof Error)).to.equal(true);
		});

		describe('Inherit from other error', function () {
			it('default', function () {
				const someError = Object.assign(new Error('test'), {
					context: 'test',
					help: 'test',
				});
				const ghostError = new errors.InternalServerError({err: someError});
				expect(ghostError.stack).to.match(/Error: test/);
				expect(ghostError.context).to.equal(someError.context);
				expect(ghostError.help).to.equal(someError.help);
			});

			it('has nested object', function () {
				// eslint-disable-next-line unicorn/error-message
				const someError = Object.assign(new Error(), {
					obj: {
						a: 'b',
					},
				});
				const ghostError = new errors.InternalServerError({
					err: someError,
				});

				// @ts-expect-error
				expect(ghostError.obj).to.equal(someError.obj);
			});

			it('with custom attribute', function () {
				// eslint-disable-next-line unicorn/error-message
				const someError = Object.assign(new Error(), {context: 'test'});
				const ghostError = new errors.InternalServerError({
					err: someError,
					context: 'context',
				});

				expect(ghostError.context).to.equal('test');
			});

			it('with custom message', function () {
				const someError = new Error(); // eslint-disable-line unicorn/error-message
				const ghostError = new errors.InternalServerError({
					err: someError,
					message: 'test',
				});

				expect(ghostError.message).to.equal('test');
			});

			it('error is string', function () {
				const ghostError = new errors.InternalServerError({
					err: 'string',
				});
				expect(ghostError.stack).to.match(/Error: string/);
			});
		});

		describe('isGradebookError', function () {
			it('can determine non-Ghost errors', function () {
				// eslint-disable-next-line unicorn/error-message
				const isGradebookError = errors.isGradebookError(new Error());
				expect(isGradebookError).to.equal(false);
			});

			it('can determine standard GhostError errors', function () {
				const isGradebookError = errors.isGradebookError(new errors.NotFoundError());
				expect(isGradebookError).to.equal(true);
			});

			it('can determine new non-GhostError errors', function () {
				class NonGhostError extends Error {
					constructor(options) {
						super(options.message);
					}
				}

				class CustomNonGhostError extends NonGhostError {}

				const error = new CustomNonGhostError({
					message: 'Doesn\'t inherit from GhostError',
				});

				const isGradebookError = errors.isGradebookError(error);
				expect(isGradebookError).to.equal(false);
			});
		});

		describe('prepareStackForUser', function () {
			it('Correctly adds Stack Trace header line', function () {
				const testStack = [
					'Error: Line 0 - Message',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n');

				const error = new Error('Test');
				error.stack = testStack;

				const {stack} = utils.prepareStackForUser(error, false);

				expect(stack).to.equal([
					'Error: Line 0 - Message',
					'Stack Trace:',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n'));
			});

			it('Injects context', function () {
				const error = Object.assign(new Error('Test'), {
					context: 'Line 1 - Context',
					stack: [
						'Error: Line 0 - Message',
						'Stack Line 1',
						'Stack Line 2',
					].join('\n'),
				});

				const {stack} = utils.prepareStackForUser(error, false);

				expect(stack).to.equal([
					'Error: Line 0 - Message',
					'Line 1 - Context',
					'Stack Trace:',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n'));
			});

			it('Injects help', function () {
				const error = Object.assign(new Error('Test'), {
					help: 'Line 2 - Help',
					stack: [
						'Error: Line 0 - Message',
						'Stack Line 1',
						'Stack Line 2',
					].join('\n'),
				});

				const {stack} = utils.prepareStackForUser(error, false);

				expect(stack).to.equal([
					'Error: Line 0 - Message',
					'Line 2 - Help',
					'Stack Trace:',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n'));
			});

			it('Injects help & context', function () {
				const error = Object.assign(new Error('Test'), {
					stack: [
						'Error: Line 0 - Message',
						'Stack Line 1',
						'Stack Line 2',
					].join('\n'),
					context: 'Line 1 - Context',
					help: 'Line 2 - Help',
				});

				const {stack} = utils.prepareStackForUser(error, false);

				expect(stack).to.equal([
					'Error: Line 0 - Message',
					'Line 1 - Context',
					'Line 2 - Help',
					'Stack Trace:',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n'));
			});

			it('removes the code stack in production mode, leaving just error message, context & help', function () {
				const testStack = [
					'Error: Line 0 - Message',
					'Stack Line 1',
					'Stack Line 2',
				].join('\n');

				const error = Object.assign(new Error('Test'), {
					stack: testStack,
					context: {firstLine: 'Line 1 - Context'},
					help: 'Line 2 - Help',
				});

				const {stack} = utils.prepareStackForUser(error, true);

				expect(stack).to.equal([
					'Error: Line 0 - Message',
					'{"firstLine":"Line 1 - Context"}',
					'Line 2 - Help',
				].join('\n'));
			});
		});

		describe('ErrorTypes', function () {
			it('InternalServerError', function () {
				const error = new errors.InternalServerError();
				expect(error.statusCode).to.equal(500);
				expect(error.level).to.equal('critical');
				expect(error.errorType).to.equal('InternalServerError');
				expect(error.message).to.equal('The server has encountered an error.');
				expect(error.hideStack).to.equal(false);
			});

			it('IncorrectUsageError', function () {
				const error = new errors.IncorrectUsageError();
				expect(error.statusCode).to.equal(400);
				expect(error.level).to.equal('critical');
				expect(error.errorType).to.equal('IncorrectUsageError');
				expect(error.message).to.equal('We detected a misuse. Please read the stack trace.');
				expect(error.hideStack).to.equal(false);
			});

			it('NotFoundError', function () {
				const error = new errors.NotFoundError();
				expect(error.statusCode).to.equal(404);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('NotFoundError');
				expect(error.message).to.equal('Resource could not be found.');
				expect(error.hideStack).to.equal(true);
			});

			it('BadRequestError', function () {
				const error = new errors.BadRequestError();
				expect(error.statusCode).to.equal(400);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('BadRequestError');
				expect(error.message).to.equal('The request could not be understood.');
				expect(error.hideStack).to.equal(false);
			});

			it('UnauthorizedError', function () {
				const error = new errors.UnauthorizedError();
				expect(error.statusCode).to.equal(401);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('UnauthorizedError');
				expect(error.message).to.equal('You are not authorised to make this request.');
				expect(error.hideStack).to.equal(false);
			});

			it('NoPermissionError', function () {
				const error = new errors.NoPermissionError();
				expect(error.statusCode).to.equal(403);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('NoPermissionError');
				expect(error.message).to.equal('You do not have permission to perform this request.');
				expect(error.hideStack).to.equal(false);
			});

			it('ValidationError', function () {
				const error = new errors.ValidationError();
				expect(error.statusCode).to.equal(422);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('ValidationError');
				expect(error.message).to.equal('The request failed validation.');
				expect(error.hideStack).to.equal(false);
			});

			it('TooManyRequestsError', function () {
				const error = new errors.TooManyRequestsError();
				expect(error.statusCode).to.equal(429);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('TooManyRequestsError');
				expect(error.message).to.equal('Server has received too many similar requests in a short space of time.');
				expect(error.hideStack).to.equal(false);
			});

			it('MaintenanceError', function () {
				const error = new errors.MaintenanceError();
				expect(error.statusCode).to.equal(503);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('MaintenanceError');
				expect(error.message).to.equal('The server is temporarily down for maintenance.');
				expect(error.hideStack).to.equal(false);
			});

			it('MethodNotAllowedError', function () {
				const error = new errors.MethodNotAllowedError();
				expect(error.statusCode).to.equal(405);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('MethodNotAllowedError');
				expect(error.message).to.equal('Method not allowed for resource.');
				expect(error.hideStack).to.equal(false);
			});

			it('RequestNotAcceptableError', function () {
				const error = new errors.RequestNotAcceptableError();
				expect(error.statusCode).to.equal(406);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('RequestNotAcceptableError');
				expect(error.message).to.equal('Request not acceptable for provided Accept-Version header.');
				expect(error.hideStack).to.equal(true);
			});

			it('RequestEntityTooLargeError', function () {
				const error = new errors.RequestEntityTooLargeError();
				expect(error.statusCode).to.equal(413);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('RequestEntityTooLargeError');
				expect(error.message).to.equal('Request was too big for the server to handle.');
				expect(error.hideStack).to.equal(false);
			});

			it('VersionMismatchError', function () {
				const error = new errors.VersionMismatchError();
				expect(error.statusCode).to.equal(400);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('VersionMismatchError');
				expect(error.message).to.equal('Requested version does not match server version.');
				expect(error.hideStack).to.equal(false);
			});

			it('EmailError', function () {
				const error = new errors.EmailError();
				expect(error.statusCode).to.equal(500);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('EmailError');
				expect(error.message).to.equal('The server encountered an error whilst sending email.');
				expect(error.hideStack).to.equal(false);
			});

			it('ConflictError', function () {
				const error = new errors.ConflictError();
				expect(error.statusCode).to.equal(409);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('ConflictError');
				expect(error.message).to.equal('The server has encountered an conflict.');
				expect(error.hideStack).to.equal(false);
			});

			it('MigrationError', function () {
				const error = new errors.MigrationError();
				expect(error.statusCode).to.equal(500);
				expect(error.level).to.equal('critical');
				expect(error.errorType).to.equal('MigrationError');
				expect(error.message).to.equal('An error has occurred applying a database migration.');
				expect(error.hideStack).to.equal(false);
			});

			it('NoContentError', function () {
				const error = new errors.NoContentError();
				expect(error.statusCode).to.equal(204);
				expect(error.level).to.equal('normal');
				expect(error.errorType).to.equal('NoContentError');
				expect(error.message).to.equal('The server has encountered an error.');
				expect(error.hideStack).to.equal(true);
			});
		});
	});
});

