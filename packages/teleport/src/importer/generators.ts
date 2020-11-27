/* eslint-disable camelcase */
import oid from 'bson-objectid';
import {ValidationError} from './errors';
import {Course, Category, Grade, Query} from '../shared/interfaces';

export function generateCourseQuery(
	_ref: string,
	user_id: string,
	course: Course,
	maxGradesPerCategory: number
): Query[] {
	const id = oid.generate();
	const courseRow = {...course, id, user_id};
	delete courseRow.categories;

	const queries: Query[] = [['courses', courseRow]];

	if (!Array.isArray(course.categories)) {
		return queries;
	}

	for (let i = 0; i < course.categories.length; ++i) {
		const category = course.categories[i];
		const ref = `${_ref}.categories[${i}]`;

		if (category.grades?.length > maxGradesPerCategory) {
			throw new ValidationError({message: `Category ${ref} has too many grades`});
		}

		queries.push(
			...generateCategoryQuery(user_id, id, category)
		);
	}

	return queries;
}

export function generateCategoryQuery(user_id: string, course_id: string, category: Category): Query[] {
	const id = oid.generate();
	const categoryRow = {...category, id, course_id};
	delete categoryRow.grades;

	const queries: Query[] = [['categories', categoryRow]];

	if (Array.isArray(category.grades)) {
		for (const grade of category.grades) {
			queries.push(generateGradeQuery(grade, user_id, course_id, id));
		}
		// CASE: All categories _must_ have at least one associated grade
	} else {
		queries.push(generateGradeQuery({name: null, grade: null}, user_id, course_id, id));
	}

	return queries;
}

export function generateGradeQuery(grade: Grade, user_id: string, course_id: string, category_id: string): Query {
	const id = oid.generate();
	return ['grades', {...grade, id, user_id, course_id, category_id}];
}
