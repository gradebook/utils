import {type BaseError} from './errors.js';

export function wrapStack(error: Error, internalError: Error) {
	const extraLine = error.stack!.split(/\n/g)[1];
	const [firstLine, ...rest] = internalError.stack!.split(/\n/g);
	return [firstLine, extraLine, ...rest].join('\n');
}

/**
 * @description Replace the stack with a user-facing one
 * @returns Clone of the original error with a user-facing stack
 */
export function prepareStackForUser<TError extends BaseError | Error>(error: TError, isProduction: boolean): TError {
	const stackFrames = error.stack!.split(/\n/);

	// We build this up backwards, so we always insert at position 1

	if (isProduction || (error as BaseError).hideStack) {
		stackFrames.splice(1, stackFrames.length - 1);
	} else {
		// Clearly mark the stack trace
		stackFrames.splice(1, 0, 'Stack Trace:');
	}

	// Add in our custom context and help methods
	if ((error as BaseError).help) {
		stackFrames.splice(1, 0, `${(error as BaseError).help}`);
	}

	if ((error as BaseError).context) {
		const {context} = error as BaseError;
		const stringifiedContext = typeof context === 'string' ? context : JSON.stringify(context);
		stackFrames.splice(1, 0, `${stringifiedContext}`);
	}

	const errorClone = (error as BaseError).clone?.() as TError | undefined ?? structuredClone(error);
	errorClone.stack = stackFrames.join('\n');
	return errorClone;
}

export function isGradebookError(error: unknown): error is BaseError {
	return typeof error === 'object' && error !== null && Boolean((error as {gradebookError?: boolean}).gradebookError);
}
