// @ts-check
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {remapRawExportIds} from '../../lib/shared/remap-id.js';
import {importUserRows} from '../../lib/importer/raw.js';
import {runSqlFile, useDatabase} from '../_utils/test-db.js';
import {createKnexProxy} from '../../lib/shared/db.js';
import {rawUserExport} from '../fixtures/user-export.js';
import {exportUserRows} from '../../lib/exporter/raw.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = useDatabase();

describe('Unit > Importer > Raw', function () {
	before(async function () {
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-ddl.sql'));
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-dml.sql'));
	});

	it('Requires a transaction', async function () {
		try {
			await importUserRows(createKnexProxy(knex, null), rawUserExport);
			expect(false, 'Should have errored').to.be.true;
		} catch (error) {
			expect(error.message).to.contain('transaction');
		}
	});

	it('Fails when the schema versions are not aligned', async function () {
		const proxy = createKnexProxy(await knex.transaction(), null);
		const clonedExport = structuredClone(rawUserExport);
		clonedExport.version = '3';

		try {
			const response = await importUserRows(proxy, clonedExport);
			expect(response).to.not.have.property('message');
			expect(response.error).to.match(/Export schema version "3" .*database schema version/);
		} finally {
			await proxy.rollback();
		}
	});

	it('Integration: Imports a user', async function () {
		const clonedExport = structuredClone(rawUserExport);
		remapRawExportIds(clonedExport);
		const transaction = createKnexProxy(await knex.transaction(), null);

		try {
			expect(await importUserRows(transaction, clonedExport)).to.deep.equal({
				message: 'User imported successfully',
			});

			expect(await exportUserRows(transaction, clonedExport.user.id)).to.deep.equal(clonedExport);
		} finally {
			await transaction.rollback();
		}
	});
});
