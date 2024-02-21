import {type RequestOptions, type RawExport} from '../shared/interfaces.js';
import {getSchemaVersion, type KnexProxy, assertInTransaction} from '../shared/db.js';

export type ImportOptions = RequestOptions;

export async function putImport(
	{school, hostname, secure = false}: ImportOptions,
	export_: RawExport,
): Promise<unknown> {
	const url = `http${secure ? 's' : ''}://${hostname}/api/v0/internal/raw-user-import?school=${school}`;
	const request = await fetch(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(export_),
	});

	if (!request.ok) {
		throw new Error(`Request failed: ${request.status} ${request.statusText}`);
	}

	return request.json();
}

export async function importUserRows(knex: KnexProxy, export_: RawExport) {
	assertInTransaction(knex);

	const schemaVersion = await getSchemaVersion(knex);

	if (schemaVersion !== export_.version) {
		return {
			error: `Export schema version "${export_.version}" does not match the database schema version "${schemaVersion}"`,
		};
	}

	// The school change is tracked as part of the import
	export_.user.total_school_changes! += 1;

	for (const table of ['users', 'courses', 'categories', 'grades'] as const) {
		const key = table === 'users' ? 'user' : table;
		await knex(table).insert(export_[key]); // eslint-disable-line no-await-in-loop
	}

	return {
		message: 'User imported successfully',
	};
}
