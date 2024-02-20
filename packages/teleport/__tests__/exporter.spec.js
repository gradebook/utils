// @ts-check
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect} from 'chai';
import nock from 'nock';
import {exporter} from '../lib/api.js';
import {exportUserRows} from '../lib/exporter.js';
import {createKnexProxy} from '../lib/shared/db.js';
import {rawUserExport} from './fixtures/user-export.js';
import {runSqlFile, useDatabase} from './_utils/test-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = useDatabase();

describe('Unit > Exporter', function () {
	before(async function () {
		await runSqlFile(knex, path.resolve(__dirname, './fixtures/database-ddl.sql'));
		await runSqlFile(knex, path.resolve(__dirname, './fixtures/database-dml.sql'));
	});

	it('getExport wraps request to server endpoint', async function () {
		try {
			nock('https://gradebook.app')
				.get('/api/v0/internal/raw-user-export?user=easy&school=easy')
				.reply(200, url => ({
					user: new URL(url, 'https://gradebook.app').searchParams.get('user'),
				}));

			nock('http://192.168.1.200')
				.get('/api/v0/internal/raw-user-export?user=lazy&school=lazy')
				.reply(200, url => ({
					user: new URL(url, 'http://192.168.1.200').searchParams.get('user'),
				}));

			const [lazyTest, easyTest] = await Promise.all([
				exporter.getExport({school: 'lazy', userId: 'lazy', hostname: '192.168.1.200'}),
				exporter.getExport({school: 'easy', userId: 'easy', secure: true}),
			]);

			expect(lazyTest).to.deep.equal({user: 'lazy'});
			expect(easyTest).to.deep.equal({user: 'easy'});
		} finally {
			nock.cleanAll();
		}
	});

	it('exportUserRows can handle users that do not exist', async function () {
		const proxy = createKnexProxy(knex, null);
		expect(await exportUserRows(proxy, '012345678901234567890123')).to.deep.equal({
			error: 'Unable to find user',
		});
	});

	it('exportUserRows generates an export', async function () {
		const proxy = createKnexProxy(knex, null);
		const userExport = await exportUserRows(proxy, '6158081ca3c0c1619d74088a');

		if ('error' in userExport) { // Only needed for type checking
			expect(userExport.error).to.not.be.ok;
			return;
		}

		expect(userExport).to.deep.equal(rawUserExport);
	});
});
