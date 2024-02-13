// @ts-check

import {type CategoryRow, type CourseRow, type GradeRow, type UserRow} from '../shared/interfaces.js';
import {type Db, type KnexProxy} from '../shared/db.js';

const hostMigrationVersions = new Map<Db, string>();

async function getSchemaVersion(knex: KnexProxy, db: Db) {
	const cachedValue = hostMigrationVersions.get(db);
	if (cachedValue !== undefined) {
		return cachedValue;
	}

	const queryBuilder = knex('migrations');
	const {version} = await queryBuilder.count('* as version').first<{version: number}>();

	const freshValue = String(version);
	hostMigrationVersions.set(db, freshValue);
	return freshValue;
}

export interface RawExportedUser {
	version: string;
	user: UserRow;
	courses: CourseRow[];
	categories: CategoryRow[];
	grades: GradeRow[];
}

export async function exportUserRows(
	knex: KnexProxy, database: Db, userId: string,
): Promise<{error: string} | RawExportedUser> {
	const user = await knex('users')
		.where('id', userId)
		.first<UserRow | undefined>();

	if (!user) {
		return {
			error: 'Unable to find user',
		};
	}

	const [
		version,
		courses,
		grades,
	] = await Promise.all([
		getSchemaVersion(knex, database),
		knex('courses').where('user_id', userId).select<CourseRow[]>(),
		knex('grades').where('user_id', userId).select<GradeRow[]>(),
	]);

	const courseIds = courses.map(course => course.id);
	const categories = await knex('categories')
		.whereIn('course_id', courseIds)
		.select<CategoryRow[]>();

	return {
		version,
		user,
		courses,
		categories,
		grades,
	};
}
