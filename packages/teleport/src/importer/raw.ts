import {type RawExportedUser} from '../exporter/raw.js';
import {getSchemaVersion, type KnexProxy, assertInTransaction} from '../shared/db.js';

export async function importUserRows(knex: KnexProxy, export_: RawExportedUser) {
	assertInTransaction(knex);

	const schemaVersion = await getSchemaVersion(knex);

	if (schemaVersion !== export_.version) {
		return {
			error: `Export schema version "${export_.version}" does not match the database schema version "${schemaVersion}"`,
		};
	}

	for (const table of ['users', 'courses', 'categories', 'grades'] as const) {
		const key = table === 'users' ? 'user' : table;
		await knex(table).insert(export_[key]); // eslint-disable-line no-await-in-loop
	}

	return {
		message: 'User imported successfully',
	};
}
