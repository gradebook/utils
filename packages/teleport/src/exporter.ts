import {
	type CategoryRow, type CourseRow, type GradeRow, type UserRow, type PublicExport, type RawExport,
} from './shared/interfaces.js';
import {getSchemaVersion, type KnexProxy} from './shared/db.js';

export interface ExportOptions {
	school: string;
	hostname?: string;
	secure?: boolean;
	userId: string;
}

export async function getExport(
	{school, userId, hostname = 'gradebook.app', secure = false}: ExportOptions,
): Promise<PublicExport> {
	const url = `http${secure ? 's' : ''}://${hostname}/api/v0/internal/raw-user-export?user=${userId}&school=${school}`;
	const request = await fetch(url);

	if (!request.ok) {
		throw new Error(`Request failed: ${request.status} ${request.statusText}`);
	}

	return request.json() as Promise<PublicExport>;
}

export async function exportUserRows(knex: KnexProxy, userId: string): Promise<{error: string} | RawExport> {
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
		getSchemaVersion(knex),
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
