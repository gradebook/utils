// @ts-check
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import {exportUserRows} from '../../lib/exporter/raw.js';
import {runSqlFile, useDatabase} from '../_utils/test-db.js';
import {createKnexProxy} from '../../lib/shared/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = useDatabase();

describe('Unit > Exporter > Raw', function () {
	before(async function () {
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-ddl.sql'));
		await runSqlFile(knex, path.resolve(__dirname, '../fixtures/database-dml.sql'));
	});

	it('Can handle users that do not exist', async function () {
		const proxy = createKnexProxy(knex, null);
		expect(await exportUserRows(proxy, '012345678901234567890123')).to.deep.equal({
			error: 'Unable to find user',
		});
	});

	it('Generates an export', async function () {
		const proxy = createKnexProxy(knex, null);
		const userExport = await exportUserRows(proxy, '6158081ca3c0c1619d74088a');

		if ('error' in userExport) { // Only needed for type checking
			expect(userExport.error).to.not.be.ok;
			return;
		}

		expect(userExport.version).to.equal('2');
		expect(userExport.user.firstName).to.not.exist;
		expect(userExport.user.first_name).to.exist;
		expect(userExport.courses).to.have.length(2);
		expect(userExport.categories).to.have.length(10);
		expect(userExport.grades).to.have.length(42);
	});
});
