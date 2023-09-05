export type Level = 'normal' | 'critical';

export interface ErrorOptions {
	id?: string;
	level?: Level;
	statusCode?: number;
	context?: unknown;
	help?: string;
	errorType?: string;
	errorDetails?: unknown;
	code?: string | null;
	property?: string | null;
	redirect?: string | null;
	message?: string;
	hideStack?: boolean;
	/** @deprecated */
	err?: string | Error | null;
	error?: string | Error | unknown | null;
}
