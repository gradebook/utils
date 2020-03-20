export class ValidationError extends Error {
	public readonly originalError: Error;

	constructor({message, originalError}: {message: string; originalError?: Error}) {
		super(message);

		if (originalError) {
			this.originalError = originalError;
		}
	}
}
