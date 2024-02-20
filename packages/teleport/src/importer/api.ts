import {Buffer} from 'buffer';
import ObjectId from 'bson-objectid';
import type {Format} from 'ajv';
import AJV from 'ajv';
import type {Export, Cutoffs} from '../shared/interfaces.js';
import {type RawExportedUser} from '../exporter/raw.js';
import {ValidationError} from './errors.js';
import {SCHEMAS} from './schema/index.js';
import {publicCourseToRaw} from './generators.js';

// Pulled from https://github.com/ajv-validator/ajv-formats/blob/ce49433448384b4c0b2407adafc345e43b85f8ea/src/formats.ts#L51
const EMAIL: Format
	/* eslint-disable-next-line unicorn/better-regex */
	= /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

const VALID_SETTINGS = new Set([
	'previous_notification',
	'tour',
	'redirectFromHome',
	'overallCredits',
	'overallGpa',
	'gpaSemester',
]);

export const validator = new AJV();
validator.addFormat('email', EMAIL);
validator.addSchema(SCHEMAS);

export interface ImportOptions {
	schemaVersion: string;
	maxCoursesPerSemester?: number;
	maxCategoriesPerCourse?: number;
	maxGradesPerCategory?: number;
	preserveDates?: boolean;
	user_id?: string;
	gid: string;
}

function _throwAJVValidationError(message_ = ''): never {
	const paths = new Set<string>();
	let message = message_ + ':';

	for (const error of validator.errors!) {
		if (!paths.has(error.instancePath)) {
			message += `\n\t${error.instancePath} ${error.message}`;
			paths.add(error.instancePath);
		}
	}

	throw new ValidationError({message});
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function coerceJSON<T extends object>(payload: Buffer | string | object, name = 'input'): T {
	const unsafeCastedPayload = payload as T;
	if (typeof payload === 'string' || payload instanceof Buffer) {
		try {
			return JSON.parse(payload.toString()) as T ?? unsafeCastedPayload;
		} catch (error) {
			throw new ValidationError({
				message: `Unable to parse ${name}`,
				originalError: error as Error,
			});
		}
	}

	return unsafeCastedPayload;
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

	for (const [index, course] of (payload.courses ?? []).entries()) {
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
export function publicToRaw(data: Buffer | string | object, options: ImportOptions): RawExportedUser {
	const uExport = runBasicValidations(data);
	const uid = options.user_id ?? new ObjectId().toHexString();

	const {
		schemaVersion,
		maxCoursesPerSemester = 7,
		maxCategoriesPerCourse = 25,
		maxGradesPerCategory = 40,
		preserveDates = true,
		gid,
	} = options;

	validateUser(uExport.user, preserveDates);
	const mappedExport: RawExportedUser = {
		version: schemaVersion,
		/* eslint-disable camelcase */
		user: {
			id: uid,
			gid,
			email: uExport.user.email,
			created_at: uExport.user.created_at,
			updated_at: uExport.user.updated_at,
			donated_at: null,
			first_name: uExport.user.firstName,
			last_name: uExport.user.lastName,
			total_school_changes: 0,
			settings: uExport.user.settings,
		},
		/* eslint-enable camelcase */
		categories: [],
		courses: [],
		grades: [],
	};

	if (!Array.isArray(uExport.courses)) {
		return {
			version: schemaVersion,
			user: mappedExport.user,
			categories: [],
			courses: [],
			grades: [],
		};
	}

	const semesters = new Map<string, number>();

	for (let i = 0; i < uExport.courses.length; ++i) {
		const course = uExport.courses[i];
		const ref = `.[${i}]`;

		let coursesInSemester = semesters.get(course.semester) ?? 0;

		if (++coursesInSemester > maxCoursesPerSemester) {
			throw new ValidationError({message: `Semester ${course.semester} has too many courses`});
		}

		semesters.set(course.semester, coursesInSemester);

		if (course.categories && course.categories.length > maxCategoriesPerCourse) {
			throw new ValidationError({message: `Course ${ref} has too many categories`});
		}

		publicCourseToRaw(course, mappedExport, maxGradesPerCategory, ref);
	}

	return mappedExport;
}
