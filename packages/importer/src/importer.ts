import oid from 'bson-objectid';
import AJV from 'ajv';
import {ValidationError} from './errors';
import {SCHEMAS} from './schema';
import {Export, Query} from './interfaces';
import {generateCourseQuery} from './generators';
import {format} from 'url';

const VALID_SETTINGS = new Set(['previous_notification', 'tour', 'redirectFromHome']);

export const validator = new AJV();
validator.addSchema(SCHEMAS);

export interface ImportOptions {
	maxCoursesPerSemester?: number;
	maxCategoriesPerCourse?: number;
	maxGradesPerCategory?: number;
}

export function coerceJSON(payload: Buffer | string | object, name = 'input'): object {
	let coerced;

	if (typeof payload !== 'object') {
		try {
			coerced = JSON.parse(payload);
		} catch (error) {
			throw new ValidationError({
				message: `Unable to parse ${name}`,
				originalError: error
			});
		}
	}

	return coerced || payload;
}

// @TODO: validate remaining fields!
export function validateUser(user: Export['user']): void {
	const settings = coerceJSON(user.settings, 'settings');
	for (const key of Object.keys(settings)) {
		if (!VALID_SETTINGS.has(key)) {
			throw new ValidationError({message: `Unknown setting: ${key}`});
		}
	}

	const formattedDate = new Date().toISOString().slice(0, 20) + '000Z';

	if (!user.created_at) {
		user.created_at = formattedDate;
	}

	if (!user.updated_at) {
		user.updated_at = formattedDate;
	}
}

export function runBasicValidations(payload: Buffer | string | object): Export {
	const passesBasicValidations = validator.validate('gradebook-v0-import', payload);

	if (!passesBasicValidations) {
		const error = validator.errorsText(validator.errors);
		throw new ValidationError({
			message: 'Export is invalid',
			originalError: new Error(error.normalize())
		});
	}

	// Note: once the payload passes all the validation errors, we know the type
	return payload as Export;
}

export function generateAPICalls(data: Buffer | string | object, options: ImportOptions = {}): Query[] {
	const uExport = runBasicValidations(data);
	const uid = oid.generate();
	const queries: Query[] = [];

	validateUser(uExport.user);

	queries.push(['user', {id: uid, ...uExport.user}]);

	const {
		maxCoursesPerSemester = 7,
		maxCategoriesPerCourse = 25,
		maxGradesPerCategory = 40
	} = options;

	const semesters = new Map<string, number>();

	if (!Array.isArray(uExport.courses)) {
		return queries;
	}

	for (let i = 0; i < uExport.courses.length; ++i) {
		const course = uExport.courses[i];
		const ref = `.[${i}]`;

		let coursesInSemester = semesters.get(course.semester) || 0;

		if (++coursesInSemester > maxCoursesPerSemester) {
			throw new ValidationError({message: `Semester ${course.semester} has too many courses`});
		}

		semesters.set(course.semester, coursesInSemester);

		if (course.categories?.length > maxCategoriesPerCourse) {
			throw new ValidationError({message: `Course ${ref} has too many categories`});
		}

		queries.push(...generateCourseQuery(ref, uid, course, maxGradesPerCategory));
	}

	return queries;
}

export default generateAPICalls;
