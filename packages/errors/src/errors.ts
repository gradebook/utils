import {randomUUID} from 'node:crypto';
import {wrapStack} from './utils.js';
import type {ErrorOptions, Level} from './types.js';

const NON_INHERITABLE_PROPERTIES = new Set(['errorType', 'name', 'statusCode', 'message', 'level']);

type WriteableBaseError = {
	-readonly [K in keyof BaseError]: BaseError[K];
};

function applyErrorProperties(outerError: BaseError, innerError: unknown) {
	for (const property of Object.getOwnPropertyNames(innerError)) {
		if (NON_INHERITABLE_PROPERTIES.has(property)) {
			continue;
		}

		// Our properties have priorities over the child
		if (property === 'code') {
			(outerError as WriteableBaseError)[property] = outerError[property] ?? (innerError as BaseError)[property];
			continue;
		}

		if (property === 'stack' && !outerError.hideStack) {
			outerError[property] = wrapStack(outerError, innerError as BaseError);
			continue;
		}

		// @ts-expect-error since the inner error isn't guaranteed to be a BaseError, we copy their properties to the
		// BaseError. You won't be able to safely use these properties, but they will be available if needed.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		(outerError as WriteableBaseError)[property] = (innerError as BaseError)[property] ?? outerError[property];
	}
}

export class BaseError extends Error implements Required<Omit<ErrorOptions, 'err'>> {
	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	readonly gradebookError = true;
	readonly statusCode: number;
	readonly code: string | null;
	readonly errorType: string;
	readonly level: Level;
	readonly id: string;
	readonly context: unknown;
	readonly help: string;
	readonly name: string;
	readonly errorDetails: unknown;
	readonly property: string | null;
	readonly redirect: string | null;
	readonly hideStack: boolean;
	readonly error: Error | unknown | null;

	constructor({
		id,
		statusCode,
		level,
		errorType,
		message,
		hideStack,
		help,
		code,
		property,
		redirect,
		context,
		errorDetails,
		error,
		err,
	}: ErrorOptions = {}) {
		super();

		this.id = id ?? randomUUID();
		this.statusCode = statusCode ?? 500;
		this.level = level ?? 'normal';
		this.errorType = errorType ?? 'InternalServerError';
		this.message = message ?? 'The server has encountered an error.';
		this.hideStack = hideStack ?? false;
		this.help = help ?? '';

		this.code = code ?? null;
		this.property = property ?? null;
		this.redirect = redirect ?? null;

		// Properties without defaults or shape
		this.context = context;
		this.errorDetails = errorDetails;

		this.name = this.errorType;

		let resolvedError = error ?? err;

		if (!resolvedError) {
			this.error = null;
			return;
		}

		if (typeof resolvedError === 'string') {
			resolvedError = new Error(resolvedError);
		}

		this.error = resolvedError;
		applyErrorProperties(this, resolvedError);
	}

	clone(): typeof this {
		return new (this.constructor as (new (options: ErrorOptions) => typeof this))({
			message: this.message,
			statusCode: this.statusCode,
			code: this.code,
			errorType: this.errorType,
			level: this.level,
			id: this.id,
			context: this.context,
			help: this.help,
			errorDetails: this.errorDetails,
			property: this.property,
			redirect: this.redirect,
			hideStack: this.hideStack,
			error: this.error,
		});
	}
}

export class InternalServerError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 500,
			level: 'critical',
			errorType: 'InternalServerError',
			message: 'The server has encountered an error.',
		} satisfies ErrorOptions, options));
	}
}

export class IncorrectUsageError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 400,
			level: 'critical',
			errorType: 'IncorrectUsageError',
			message: 'We detected a misuse. Please read the stack trace.',
		} satisfies ErrorOptions, options));
	}
}

export class NotFoundError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 404,
			errorType: 'NotFoundError',
			message: 'Resource could not be found.',
			hideStack: true,
		} satisfies ErrorOptions, options));
	}
}

export class BadRequestError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 400,
			errorType: 'BadRequestError',
			message: 'The request could not be understood.',
		} satisfies ErrorOptions, options));
	}
}

export class UnauthorizedError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 401,
			errorType: 'UnauthorizedError',
			message: 'You are not authorised to make this request.',
		} satisfies ErrorOptions, options));
	}
}

export class NoPermissionError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 403,
			errorType: 'NoPermissionError',
			message: 'You do not have permission to perform this request.',
		} satisfies ErrorOptions, options));
	}
}

export class ValidationError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 422,
			errorType: 'ValidationError',
			message: 'The request failed validation.',
		} satisfies ErrorOptions, options));
	}
}
export class TooManyRequestsError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 429,
			errorType: 'TooManyRequestsError',
			message: 'Server has received too many similar requests in a short space of time.',
		} satisfies ErrorOptions, options));
	}
}

export class MaintenanceError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 503,
			errorType: 'MaintenanceError',
			message: 'The server is temporarily down for maintenance.',
		} satisfies ErrorOptions, options));
	}
}

export class MethodNotAllowedError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 405,
			errorType: 'MethodNotAllowedError',
			message: 'Method not allowed for resource.',
		} satisfies ErrorOptions, options));
	}
}

export class RequestNotAcceptableError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 406,
			errorType: 'RequestNotAcceptableError',
			message: 'Request not acceptable for provided Accept-Version header.',
			hideStack: true,
		} satisfies ErrorOptions, options));
	}
}

export class RequestEntityTooLargeError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 413,
			errorType: 'RequestEntityTooLargeError',
			message: 'Request was too big for the server to handle.',
		} satisfies ErrorOptions, options));
	}
}

export class VersionMismatchError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 400,
			errorType: 'VersionMismatchError',
			message: 'Requested version does not match server version.',
		} satisfies ErrorOptions, options));
	}
}

export class EmailError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			statusCode: 500,
			errorType: 'EmailError',
			message: 'The server encountered an error whilst sending email.',
		} satisfies ErrorOptions, options));
	}
}

export class NoContentError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			errorType: 'NoContentError',
			statusCode: 204,
			hideStack: true,
		} satisfies ErrorOptions, options));
	}
}

export class ConflictError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			errorType: 'ConflictError',
			statusCode: 409,
			message: 'The server has encountered an conflict.',
		} satisfies ErrorOptions, options));
	}
}

export class MigrationError extends BaseError {
	constructor(options?: ErrorOptions) {
		super(Object.assign({
			errorType: 'MigrationError',
			message: 'An error has occurred applying a database migration.',
			level: 'critical',
		} satisfies ErrorOptions, options));
	}
}

export {isGradebookError} from './utils.js';
