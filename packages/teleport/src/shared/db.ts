import {type Knex, knex} from 'knex';

type KnexProxyFunction = (table: string) => Knex.QueryBuilder;

export type KnexQueryProxy = KnexProxyFunction & {
	// Force QB to only come from the knex proxy to ensure the schema is always set
	[TKnex in Exclude<keyof Knex, keyof Knex.QueryBuilder>]: Knex[TKnex];
};

export type KnexTransactionProxy = KnexProxyFunction & {
	// Force QB to only come from the knex proxy to ensure the schema is always set
	[TKnexTransaction in Exclude<keyof Knex.Transaction, keyof Knex.QueryBuilder>]: Knex.Transaction[TKnexTransaction];
};

export type KnexProxy = KnexQueryProxy | KnexTransactionProxy;

function createKnexProxy(instance: Knex.Transaction, database: string | null): KnexTransactionProxy;
function createKnexProxy(instance: Knex, database: string | null): KnexQueryProxy;
function createKnexProxy(instance: Knex | Knex.Transaction, database: string | null): KnexProxy {
	const functionDeclaration = database
		? (table: string) => instance(table).withSchema(database)
		: (table: string) => instance(table);

	Object.assign(functionDeclaration, instance);
	// @ts-expect-error All the properties are added through the Object.assign in the previous line
	return functionDeclaration;
}

export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: string | null,
	transactionCallback?: null
): Promise<Knex.Transaction<any, TResponse>>;
export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: string | null,
	transactionCallback: (context: KnexTransactionProxy) => Promise<TResponse>
): Promise<TResponse>;
// eslint-disable-next-line @typescript-eslint/promise-function-async
export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: string | null,
	transactionCallback?: ((context: KnexTransactionProxy) => Promise<TResponse>) | null,
) {
	if (transactionCallback) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		return knex.transaction(trx => {
			const proxy = createKnexProxy(trx, database);
			return transactionCallback(proxy);
		});
	}

	return knex.transaction().then(trx => {
		const proxy = createKnexProxy(trx, database);
		return proxy;
	});
}

export function assertInTransaction(instance: KnexProxy | Knex.QueryBuilder): instance is KnexTransactionProxy | Knex.QueryBuilder {
	if (!(instance as KnexProxy).isTransaction) {
		throw new Error('Expected to be in a transaction');
	}

	return true;
}
