import {Category as ICategory} from './interfaces/category';
import {Course as ICourse} from './interfaces/course';

const COURSE_NAME = /^[a-z]{3,4}-\d{3,4}$/i;

const validCourseName = (name: string): boolean => COURSE_NAME.test(name);
const validCategoryName = (name: string): boolean => name.length >= 1 && name.length <= 50;
const validWeight = (weight: number): boolean => weight >= 0 && weight < 1000000;
const validCut = (cut: number): boolean => cut >= 10 && cut <= 10000;
const validCredits = (credits: number): boolean => credits >= 0 && credits <= 5;
const validTotalGrades = (totalGrades: number): boolean => totalGrades >= 1 && totalGrades <= 40;
const validDroppedGrades = (totalDropped: number, totalGrades: number): boolean =>
	totalDropped >= 0 && totalGrades > totalDropped;

export const EXPORT_VERSION = 0;

export function isomorphicAtoB(input: string): string {
	// @ts-ignore
	if (typeof atob === 'function') { // eslint-disable-line no-undef
		// @ts-ignore
		return atob(input); // eslint-disable-line no-undef
	}

	return Buffer.from(input).toString('base64');
}

export function isomorphicBtoA(input: string): string {
	// @ts-ignore
	if (typeof btoa === 'function') { // eslint-disable-line no-undef
		// @ts-ignore
		return btoa(input); // eslint-disable-line no-undef
	}

	return Buffer.from(input, 'base64').toString('utf8');
}

export function _validateCategory(category: ICategory): boolean {
	// CASE: only real categories can have dropped grades or more than 1 grade
	if (!category.isReallyCategory && (category.droppedGrades !== 0 || category.numGrades !== 1)) {
		return false;
	}

	return (
		validTotalGrades(category.numGrades) &&
		validDroppedGrades(category.droppedGrades, category.numGrades) &&
		validWeight(category.weight) &&
		validCategoryName(category.name)
	);
}

export function validate(course: ICourse): boolean {
	return (
		validCourseName(course.name) &&
		validCut(course.cut1) &&
		validCut(course.cut2) &&
		validCut(course.cut3) &&
		validCut(course.cut4) &&
		validCredits(course.credits) &&
		course.categories.map(_validateCategory).filter(t => !t).length > 0
	);
}

export interface _ISerializedPayload {
	m: string;
	z: string[]; // Categories
}

export interface IUnsafeCategory {
	id?: string;
	user_id?: string; // eslint-disable-line camelcase
	course_id?: string; // eslint-disable-line camelcase
	name: string;
	weight: number;
	dropped: number;
	grades?: [{
		name: string;
		grade: number;
	}];
}

export interface IUnsafeCourse {
	name: string;
	credits: number;
	cut1: number;
	cut1Name?: string;
	cut2: number;
	cut2Name?: string;
	cut3: number;
	cut3Name?: string;
	cut4: number;
	cut4Name?: string;
	semester?: string;
	categories?: IUnsafeCategory[] | ICategory[];
}

export interface ICourseWithMeta extends ICourse {
	version: number;
	year: number;
}

/**
 * @name _serializeCategory
 * @description converts a category into a compressed stream that can be parsed
 * by _deserializeCategory
 *
 * Output format: {isReallyCategory}|{droppedGrades}|{numGrades}|{weight}|{name}
 *
 * Name goes last because it can contain pipes and there's no need to add
 * escaping on top of decoding
 */
export function _serializeCategory(category: ICategory): string {
	let built = '';

	built += `${category.isReallyCategory ? 1 : 0}|`;
	built += `${category.droppedGrades}|`;
	built += `${category.numGrades}|`;
	built += `${category.weight}|`;
	built += `${category.name}`;

	return built;
}

/**
 * @name _serializeCourseMeta
 * @description converts a course into a compressed stream that can be parsed
 * by _deserializeCourseMeta while adding some metadata
 *
 * Output format: {version}|{year}|{credits}|{cut1}|{cut2}|{cut3}|{cut4}|{name}
 *
 * Name goes last because it can contain pipes and there's no need to add
 * escaping on top of decoding
 */
export function _serializeCourseMeta(course: ICourse): string {
	let built = `${EXPORT_VERSION}|`;

	built += new Date().getFullYear().toString() + '|';
	built += `${course.credits}|`;
	built += `${course.cut1}|`;
	built += `${course.cut2}|`;
	built += `${course.cut3}|`;
	built += `${course.cut4}|`;
	built += course.name;
	return built;
}

export function _deserializeCategory(category: string): ICategory {
	const [r, d, t, w, ...n] = category.split('|');

	return {
		isReallyCategory: Number(r) === 1,
		droppedGrades: Number(d),
		numGrades: Number(t),
		weight: Number(w),
		name: n.join('|')
	};
}

export function _deserializeCourseMeta(course: string): ICourseWithMeta {
	const [v, y, cr, a, b, c, d, ...n] = course.split('|');

	return {
		version: Number(v),
		year: Number(y),
		credits: Number(cr),
		cut1: Number(a),
		cut2: Number(b),
		cut3: Number(c),
		cut4: Number(d),
		name: n.join('|'),
		categories: null
	};
}

export function _stripCategory(category: ICategory | IUnsafeCategory): ICategory {
	return {
		name: category.name,
		// @ts-ignore
		numGrades: category.grades?.length ?? 0,
		// @ts-ignore
		droppedGrades: category.dropped ?? category.droppedGrades ?? 0,
		weight: category.weight,
		// @ts-ignore
		isReallyCategory: category.grades?.length === 1
	};
}

export function strip(course: ICourse | IUnsafeCourse): ICourse {
	return {
		name: course.name,
		credits: course.credits,
		cut1: course.cut1,
		cut2: course.cut2,
		cut3: course.cut3,
		cut4: course.cut4,
		// @ts-ignore
		categories: course.categories.map(_stripCategory)
	};
}

export function serialize(validatedCourse: ICourse): string {
	const compressedPayload: _ISerializedPayload = {
		m: _serializeCourseMeta(validatedCourse),
		z: validatedCourse.categories.map(_serializeCategory)
	};

	return isomorphicAtoB(JSON.stringify(compressedPayload));
}

export function deserialize(hash: string): ICourse {
	const payload: _ISerializedPayload = JSON.parse(isomorphicBtoA(hash));

	return {
		..._deserializeCourseMeta(payload.m),
		categories: payload.z.map(_deserializeCategory)
	};
}
