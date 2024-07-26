// @ts-check
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {importUser, exportUser} from '../lib/transfer.js';
import {remapRawExportIds} from '../lib/shared/remap-id.js';
import {rawUserExport} from './fixtures/user-export.js';
import {runSqlFile, useDatabase} from './_utils/test-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = useDatabase();

async function assertTotalSchoolChanges(userId, totalSchoolChanges) {
	const user = await knex('users')
		.select('total_school_changes')
		.where('id', userId)
		.first();

	expect(user).to.deep.equal({total_school_changes: totalSchoolChanges}); // eslint-disable-line camelcase
}

async function setTotalSchoolChanges(userId, totalSchoolChanges) {
	await knex('users')
		.where('id', userId)
		.update({total_school_changes: totalSchoolChanges}); // eslint-disable-line camelcase
}

async function deleteUser(userId) {
	await knex('grades')
		.where('user_id', userId)
		.del();

	await knex('categories')
		.whereIn('course_id', knex('courses').select('id').where('user_id', userId))
		.del();

	await knex('courses')
		.where('user_id', userId)
		.del();
}

describe('Unit > Transfer', function () {
	before(async function () {
		await runSqlFile(knex, path.resolve(__dirname, './fixtures/database-ddl.sql'));
		await runSqlFile(knex, path.resolve(__dirname, './fixtures/database-dml.sql'));
	});

	describe('importUser', function () {
		it('Gracefully handles an existing user (id)', async function () {
			const rawImport = structuredClone(rawUserExport);
			rawImport.user.gid = '012345678901234567890123';

			const importResult = await importUser(knex, null, rawImport);
			expect(importResult).to.deep.equal({
				error: 'User ID is already in use',
			});
		});

		it('Gracefully handles an existing user (gid)', async function () {
			const rawImport = structuredClone(rawUserExport);
			remapRawExportIds(rawImport);

			const importResult = await importUser(knex, null, rawImport);
			expect(importResult).to.deep.equal({
				error: 'User Google ID is already in use',
			});
		});

		it('Imports a user', async function () {
			const rawImport = structuredClone(rawUserExport);
			remapRawExportIds(rawImport);
			rawImport.user.gid = '0123456789012345678901';

			const importResult = await importUser(knex, null, rawImport);
			expect(importResult).to.deep.equal({
				message: 'User imported successfully',
			});

			await deleteUser(rawImport.user.id);
		});
	});

	describe('exportUser', function () {
		it('Gracefully handles an invalid user', async function () {
			const rawExport = await exportUser(knex, null, 'notauser');
			expect(rawExport).to.deep.equal({
				error: 'User does not exist',
			});
		});

		it('Gracefully handles a locked user', async function () {
			const user = rawUserExport.user.id;
			try {
				await assertTotalSchoolChanges(user, 0);
				expect(await exportUser(knex, null, user)).to.deep.equal(rawUserExport);
				expect(await exportUser(knex, null, user)).to.deep.equal({
					error: 'User is locked. Is there an ongoing transfer?',
				});
				await assertTotalSchoolChanges(user, null);
			} finally {
				await setTotalSchoolChanges(user, 0);
			}
		});

		it('Gracefully limits the number of school changes', async function () {
			const user = rawUserExport.user.id;
			try {
				expect(await exportUser(knex, null, user, 0)).to.deep.equal({
					error: 'User has exceeded the maximum transfer count',
				});
				await assertTotalSchoolChanges(user, 0);
			} finally {
				await setTotalSchoolChanges(user, 0);
			}
		});

		it('Generates a raw user export and locks them', async function () {
			const user = rawUserExport.user.id;
			try {
				await assertTotalSchoolChanges(user, 0);

				const rawExport = await exportUser(knex, null, user);
				expect(rawExport).to.deep.equal(rawUserExport);

				await assertTotalSchoolChanges(user, null);
			} finally {
				await setTotalSchoolChanges(user, 0);
			}
		});
	});
});
