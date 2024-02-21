import {type Knex} from 'knex';
import {runInKnexTransactionProxy, assertInTransaction, type KnexProxy, type Db} from './shared/db.js';
import {type RawExport} from './shared/interfaces.js';
import {exportUserRows} from './exporter.js';
import {importUserRows} from './importer/raw.js';

async function lockUser(knex: KnexProxy, id: string, maxTransferCount: number | undefined) {
	assertInTransaction(knex);

	const user = await knex('users')
		.where('id', id)
		.select('total_school_changes')
		.first<{total_school_changes: number} | undefined>();

	if (!user) {
		return {error: 'User does not exist'};
	}

	if (user.total_school_changes === null) {
		return {error: 'User is locked. Is there an ongoing transfer?'};
	}

	if (maxTransferCount !== undefined && user.total_school_changes >= maxTransferCount) {
		return {error: 'User has exceeded the maximum transfer count'};
	}

	await knex('users')
		.where('id', id)
		.update('total_school_changes', null);

	return user.total_school_changes;
}

export async function importUser(knex: Knex, database: Db, export_: RawExport) {
	return runInKnexTransactionProxy(knex, database, async knexProxy => {
		const user = await knexProxy('users')
			.where('id', export_.user.id)
			.orWhere('gid', export_.user.gid)
			.select('id', 'gid')
			.first<{id: string; gid: string} | undefined>();

		if (user) {
			const columnFailure = user.gid === export_.user.gid ? 'Google ID' : 'ID';
			return {
				error: `User ${columnFailure} is already in use`,
			};
		}

		return importUserRows(knexProxy, export_);
	});
}

export async function exportUser(knex: Knex, database: Db, user: string, maxTransferCount?: number) {
	return runInKnexTransactionProxy(knex, database, async transaction => {
		const totalSchoolChanges = await lockUser(transaction, user, maxTransferCount);

		if (typeof totalSchoolChanges !== 'number') {
			return totalSchoolChanges;
		}

		const response = await exportUserRows(transaction, user);
		if ('user' in response) {
			// We lock the user by setting their total_school_changes to null. However, when importing we'll have to
			// eslint-disable-next-line camelcase
			response.user.total_school_changes = totalSchoolChanges;
		} else {
			// If exporting the user fails, abort the transaction to avoid locking them
			await transaction.rollback();
		}

		return response;
	});
}
