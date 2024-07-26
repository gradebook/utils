// @ts-check
import {expect} from 'chai';
import knex from 'knex';
import {after} from 'mocha';
import {assertInTransaction, runInKnexTransactionProxy} from '../../lib/shared/db.js';

const db = knex({
	client: 'sqlite3',
	useNullAsDefault: true,
	connection: {
		filename: ':memory:',
	},
});

after(() => { // eslint-disable-line mocha/no-top-level-hooks
	db.destroy();
});

describe('Unit > Shared > db', function () {
	it('runInKnexTransactionProxy', async function () {
		// #region setup
		await db.schema.createTable('people', builder => {
			builder.increments('id').primary();
			builder.string('name', 25);
		});

		await db('people').insert([
			{name: 'John Doe'},
			{name: 'Jane Doe'},
		]);
		// #endregion

		// NOTE: Do not DRY the callback - we also want to check the automatic type hinting
		const transactionProxyResponse = await runInKnexTransactionProxy(db, null, async trx => {
			const person = await trx('people').where('name', 'Jane Doe').first();
			await trx('people').insert({name: 'Mary Doe'});
			await trx.rollback();
			expect(person).to.have.property('name');
			return 7;
		});

		// NOTE: Do not DRY the callback - we also want to check the automatic type hinting
		const knexTransactionResponse = await db.transaction(async trx => {
			const person = await trx('people').where('name', 'Jane Doe').first();
			await trx('people').insert({name: 'Mary Doe'});
			await trx.rollback();
			expect(person).to.have.property('name');
			return 7;
		});

		expect(transactionProxyResponse, 'Callback behavior is the same').to.equal(knexTransactionResponse);

		const proxyTransaction = await runInKnexTransactionProxy(db, null);
		expect(proxyTransaction.isTransaction).to.equal(true);
		await proxyTransaction.rollback();
	});

	it('assertInTransaction', async function () {
		const shouldThrow = (instance, reason) => expect(() => assertInTransaction(instance), reason).to.throw(/in a transaction/);
		const shouldNotThrow = (instance, reason) => expect(() => assertInTransaction(instance), reason).to.not.throw();

		shouldThrow(db, 'Knex instance');
		/** @type {any} */
		let transaction = db.transaction();

		try {
			shouldThrow(transaction, 'Knex transaction promise');
			const realTransaction = await transaction;
			shouldNotThrow(realTransaction, 'Knex transaction');
		} finally {
			const realTransaction = await transaction;
			await realTransaction.rollback();
		}

		transaction = runInKnexTransactionProxy(db, null, null);
		try {
			shouldThrow(transaction, 'Proxy transaction promise (async)');
			const realTransaction = await transaction;
			shouldNotThrow(realTransaction, 'Proxy transaction (async)');
		} finally {
			const realTransaction = await transaction;
			await realTransaction.rollback();
		}

		transaction = runInKnexTransactionProxy(db, null, trx => trx.rollback());
		try {
			shouldThrow(transaction, 'Proxy transaction promise (callback)');
		} finally {
			await transaction;
		}

		await runInKnexTransactionProxy(db, null, trx => {
			try {
				shouldNotThrow(trx, 'Proxy transaction (callback)');
			} finally {
				// eslint-disable-next-line no-unsafe-finally
				return trx.rollback();
			}
		});
	});
});
