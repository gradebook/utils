/* eslint-disable camelcase */
import ObjectId from 'bson-objectid';
import type {PublicCourse, PublicCategory, PublicGrade} from '../shared/interfaces.js';
import {type RawExportedUser} from '../exporter/raw.js';
import {ValidationError} from './errors.js';

export function publicCourseToRaw(
	course: PublicCourse,
	mappedExport: RawExportedUser,
	maxGradesPerCategory: number,
	courseRef: string,
) {
	const user_id = mappedExport.user.id;
	const id = new ObjectId().toHexString();

	mappedExport.courses.push({
		id,
		user_id,
		name: course.name,
		semester: course.semester,
		credit_hours: course.credit_hours,
		cutoffs: course.cutoffs,
		settings: course.settings,
	});

	if (!Array.isArray(course.categories)) {
		return;
	}

	for (let i = 0; i < course.categories.length; ++i) {
		const category = course.categories[i];
		const ref = `${courseRef}.categories[${i}]`;

		if (!category.grades || category.grades.length > maxGradesPerCategory) {
			throw new ValidationError({message: `Category ${ref} has too many grades`});
		}

		publicCategoryToRaw(category, mappedExport, id);
	}
}

export function publicCategoryToRaw(category: PublicCategory, mappedExport: RawExportedUser, course_id: string) {
	const id = new ObjectId().toHexString();
	mappedExport.categories.push({
		id,
		course_id,
		name: category.name,
		dropped_grades: category.dropped_grades,
		weight: category.weight,
		position: category.position,
	});

	if (Array.isArray(category.grades)) {
		for (const grade of category.grades) {
			publicGradeToRaw(grade, mappedExport, course_id, id);
		}
		// CASE: All categories _must_ have at least one associated grade
	} else {
		publicGradeToRaw({name: null, grade: null}, mappedExport, course_id, id);
	}
}

export function publicGradeToRaw(grade: PublicGrade, mappedExport: RawExportedUser, course_id: string, category_id: string) {
	mappedExport.grades.push({
		...grade,
		id: new ObjectId().toHexString(),
		user_id: mappedExport.user.id,
		course_id,
		category_id,
	});
}
