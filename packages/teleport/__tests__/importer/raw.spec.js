// @ts-check
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import nock from 'nock';
import {remapRawExportIds} from '../../lib/shared/remap-id.js';
import {importUserRows, putImport} from '../../lib/importer/raw.js';
import {runSqlFile, useDatabase} from '../_utils/test-db.js';
import {createKnexProxy} from '../../lib/shared/db.js';
import {rawUserExport} from '../fixtures/user-export.js';
import {exportUserRows} from '../../lib/exporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = useDatabase();

describe('Unit > Importer > Raw', function () {
	before(async function () {
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-ddl.sql'));
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-dml.sql'));
	});

	it('putImport wraps request to server endpoint', async function () {
		try {
			nock('https://gradebook.app')
				.post('/api/v0/internal/raw-user-import?school=easy')
				.reply(200, (url, body) => ({
					// @ts-expect-error
					version: body.version,
					// @ts-expect-error
					user: body.user.id,
					school: new URL(url, 'http://192.168.1.200').searchParams.get('school'),
				}));

			nock('http://192.168.1.200')
				.post('/api/v0/internal/raw-user-import?school=lazy')
				.reply(200, (url, body) => ({
					// @ts-expect-error
					version: body.version,
					// @ts-expect-error
					user: body.user.id,
					school: new URL(url, 'http://192.168.1.200').searchParams.get('school'),
				}));

			const [lazyTest, easyTest] = await Promise.all([
				putImport({school: 'lazy', hostname: '192.168.1.200'}, rawUserExport),
				putImport({school: 'easy', hostname: 'gradebook.app', secure: true}, rawUserExport),
			]);

			expect(lazyTest).to.deep.equal({user: rawUserExport.user.id, version: rawUserExport.version, school: 'lazy'});
			expect(easyTest).to.deep.equal({user: rawUserExport.user.id, version: rawUserExport.version, school: 'easy'});
		} finally {
			nock.cleanAll();
		}
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
