import {Category as ICategory, ApiCategory as IApiCategory} from './interfaces/category';
import {Course as ICourse, Cutoffs as ICutoffs, ApiCourse as IApiCourse} from './interfaces/course';

const COURSE_NAME = /^[a-z]{3,4}-\d{3,4}$/i;
const CUTOFFS = new Set(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']);

const validCourseName = (name: string): boolean => COURSE_NAME.test(name);
const validCategoryName = (name: string): boolean => name.length >= 1 && name.length <= 50;
const validWeight = (weight: number): boolean => weight >= 0 && weight < 1000000;
const validCredits = (credits: number): boolean => credits >= 0 && credits <= 5;
const validNumberCategories = (categories: ICategory[]): boolean => categories.length >= 2;
const validTotalGrades = (totalGrades: number): boolean => totalGrades >= 1 && totalGrades <= 40;
const validDroppedGrades = (totalDropped: number, totalGrades: number): boolean =>
	totalDropped >= 0 && totalGrades > totalDropped;
const validCut = (cut: number): boolean => cut >= 10 && cut <= 10000;
const validCutName = (cutName: string): boolean => CUTOFFS.has(cutName);
const validCutoffs = (cutoffs: ICutoffs): boolean => {
	for (const [cutName, cutValue] of Object.entries(cutoffs)) {
		if (!validCutName(cutName) || !validCut(cutValue)) {
			return false;
		}
	}

	return true;
};

export const EXPORT_VERSION = 1;

export function isomorphicAtoB(input: string): string {
	// @ts-expect-error
	if (typeof atob === 'function') { // eslint-disable-line no-undef
		// @ts-expect-error
		return atob(input); // eslint-disable-line no-undef
	}

	return Buffer.from(input, 'base64').toString('utf8');
}

export function isomorphicBtoA(input: string): string {
	// @ts-expect-error
	if (typeof btoa === 'function') { // eslint-disable-line no-undef
		// @ts-expect-error
		return btoa(input); // eslint-disable-line no-undef
	}

	return Buffer.from(input).toString('base64');
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
		validCutoffs(course.cutoffs) &&
		validCredits(course.credits) &&
		validNumberCategories(course.categories) &&
		course.categories.map(category => _validateCategory(category)).filter(t => !t).length > 0
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
	cutoffs: ICutoffs;
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
	if (!(category.name && (category.weight || category.weight === 0))) {
		return null;
	}

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
 * Output format: {version}|{year}|{credits}|{numCutoffs}|({cut1Name},{cut1Value}|)[numCutoffs]|{name}
 *
 * Name goes last because it can contain pipes and there's no need to add
 * escaping on top of decoding
 */
export function _serializeCourseMeta(course: ICourse): string {
	let built = `${EXPORT_VERSION}|`;
	const cutoffs = Object.entries(course.cutoffs);

	built += new Date().getFullYear().toString() + '|';
	built += `${course.credits}|`;
	built += `${cutoffs.length}|`;

	for (const [name, value] of cutoffs) {
		built += `${name},${value}|`;
	}

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
	let [
		version,
		year,
		credits,
		totalCutoffs,
		...remaining
	] = course.split('|');

	let cutoffs: string[] = [];
	let name = '';

	if (version === '0') {
		// We need to convert a v0 export to a v1 export. In the v0 export, the number of
		// cutoffs was static (4), so we didn't have that property in the serialization.
		// In v1, this property was added, so relative to the v1 schema, v0 will be off
		// by 1. This performs a "migration" to convert a v0 export to v1.
		// This was the v0 schema:
		// {version}|{year}|{credits}|{cut1}|{cut2}|{cut3}|{cut4}|{cut1Name}|{cut2Name}|{cut3Name}|{cut4Name}|{name}
		cutoffs.push(`${remaining[3]},${totalCutoffs}`);
		cutoffs.push(`${remaining[4]},${remaining[0]}`);
		cutoffs.push(`${remaining[5]},${remaining[1]}`);
		cutoffs.push(`${remaining[6]},${remaining[2]}`);
		name = remaining.slice(7).join('|');
		totalCutoffs = '4';
	} else if (version === '1') {
		cutoffs = remaining.slice(0, Number(totalCutoffs));
		name = remaining.slice(Number(totalCutoffs)).join('|');
	}

	return {
		version: Number(version),
		year: Number(year),
		credits: Number(credits),
		name,
		categories: null,
		// Vikas wrote this code so blame him for using reduce :) He says it's the easiest
		// way to transform an array to an object inline
		// eslint-disable-next-line unicorn/no-reduce
		cutoffs: cutoffs.reduce<{[s: string]: number}>((allCutoffs, currentCutoff) => {
			const [name, value] = currentCutoff.split(',');
			allCutoffs[name] = Number(value);
			return allCutoffs;
		}, {})
	};
}

export function _stripCategory(category: ICategory | IUnsafeCategory): ICategory {
	return {
		name: category.name,
		// @ts-expect-error
		numGrades: category.grades?.length ?? 0,
		// @ts-expect-error
		droppedGrades: category.dropped ?? category.droppedGrades ?? 0,
		weight: category.weight,
		// @ts-expect-error
		isReallyCategory: (category.grades?.length !== 1)
	};
}

export function strip(course: ICourse | IUnsafeCourse): ICourse {
	return {
		name: course.name,
		credits: course.credits,
		cutoffs: course.cutoffs,
		// @ts-expect-error
		categories: course.categories.map(category => _stripCategory(category))
	};
}

export function serialize(validatedCourse: ICourse): string {
	const compressedPayload: _ISerializedPayload = {
		m: _serializeCourseMeta(validatedCourse),
		z: validatedCourse.categories.map(category => _serializeCategory(category)).filter(Boolean)
	};

	return isomorphicBtoA(JSON.stringify(compressedPayload));
}

export function deserialize(hash: string): ICourse {
	const payload: _ISerializedPayload = JSON.parse(isomorphicAtoB(hash));

	return {
		..._deserializeCourseMeta(payload.m),
		categories: payload.z.map(category => _deserializeCategory(category))
	};
}

export function prepareCourseForAPI(course: ICourse, semester: string): IApiCourse {
	let currentPosition = 0;
	const categories: IApiCategory[] = course.categories.map(category => {
		currentPosition += 100;

		return {
			name: category.name,
			weight: category.weight,
			position: currentPosition,
			dropped: category.droppedGrades,
			numGrades: category.numGrades
		};
	});

	return {
		course: {
			semester,
			name: course.name,
			credits: course.credits,
			cutoffs: JSON.stringify(course.cutoffs)
		},
		categories
	};
}

export {ICategory, ICourse};
