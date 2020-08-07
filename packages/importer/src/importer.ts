import oid from 'bson-objectid';
import AJV from 'ajv';
import Knex from 'knex';
import {ValidationError} from './errors';
import {SCHEMAS} from './schema';
import {Export, Query, Cutoffs} from './interfaces';
import {generateCourseQuery} from './generators';

const VALID_SETTINGS = new Set([
	'previous_notification',
	'tour',
	'redirectFromHome',
	'overallCredits',
	'overallGpa',
	'gpaSemester'
]);

export const validator = new AJV();
validator.addSchema(SCHEMAS);

export interface ImportOptions {
	maxCoursesPerSemester?: number;
	maxCategoriesPerCourse?: number;
	maxGradesPerCategory?: number;
	preserveDates?: boolean;
	user_id?: string; // eslint-disable-line camelcase
	gid: string;
}

function _throwAJVValidationError(message_ = ''): never {
	const paths = new Set<string>();
	let message = message_ + ':';

	for (const error of validator.errors) {
		if (!paths.has(error.dataPath)) {
			message += `\n\t${error.dataPath} ${error.message}`;
			paths.add(error.dataPath);
		}
	}

	throw new ValidationError({message});
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function coerceJSON<T extends object>(payload: Buffer | string | object, name = 'input'): T {
	let coerced;

	if (typeof payload === 'string' || payload instanceof Buffer) {
		try {
			coerced = JSON.parse(payload.toString());
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
export function validateUser(user: Export['user'], preserveDates: boolean): void {
	const settings = coerceJSON(user.settings, 'settings');
	for (const key of Object.keys(settings)) {
		if (!VALID_SETTINGS.has(key)) {
			throw new ValidationError({message: `Unknown setting: ${key}`});
		}
	}

	const formattedDate = new Date().toISOString().slice(0, 20) + '000Z';

	if (!user.created_at || !preserveDates) {
		user.created_at = formattedDate; // eslint-disable-line camelcase
	}

	if (!user.updated_at || !preserveDates) {
		user.updated_at = formattedDate; // eslint-disable-line camelcase
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function runBasicValidations(payload_: Buffer | string | object): Export {
	const payload = coerceJSON<Export>(payload_);
	const passesBasicValidations = validator.validate('gradebook-v0-import', payload);

	if (!passesBasicValidations) {
		_throwAJVValidationError('Export is invalid');
	}

	for (const [index, course] of payload.courses?.entries()) {
		const {cutoffs} = course;
		const parsedCuts = coerceJSON<Cutoffs>(cutoffs, `.course[${index}].cutoffs`);
		const isValid = validator.validate('gradebook-cutoffs', parsedCuts);

		if (!isValid) {
			_throwAJVValidationError(`.course[${index}].cutoffs is invalid`);
		}
	}

	return payload;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function generateAPICalls(data: Buffer | string | object, options: ImportOptions): Query[] {
	const uExport = runBasicValidations(data);
	const uid = options.user_id || oid.generate();
	const queries: Query[] = [];

	const {
		maxCoursesPerSemester = 7,
		maxCategoriesPerCourse = 25,
		maxGradesPerCategory = 40,
		preserveDates = true,
		gid
	} = options;

	validateUser(uExport.user, preserveDates);
	queries.push(['users', {id: uid, gid, ...uExport.user}]);

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

export async function runQueries(knex: Knex, queries: Query[], preserveUser = false): Promise<void> {
	const txn = await knex.transaction();

	if (!preserveUser) {
		if (queries[0][0] !== 'users') {
			throw new Error('Cannot find user in query list');
		}

		const {id} = queries[0][1];
		await txn('grades').where('user_id', id).del();
		await txn('categories').whereIn('id', txn('courses').select('id').where('user_id', id)).del();
		await txn('courses').where('user_id', id).del();
		await txn('users').where('id', id).del();
	}

	try {
		for (const [table, data] of queries) {
			/* eslint-disable-next-line no-await-in-loop */
			await txn(table).insert(data);
		}

		await txn.commit();
	} catch (error) {
		await txn.rollback();
		throw error;
	}
}

export default generateAPICalls;
