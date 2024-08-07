import {type Knex} from 'knex';

const schemaName = Symbol('Schema');
export type Db = string | null;

interface SchemaName {
	[schemaName]: Db;
}

type KnexProxyFunction = (table: string) => Knex.QueryBuilder;

export type KnexQueryProxy = KnexProxyFunction & SchemaName & {
	// Force QB to only come from the knex proxy to ensure the schema is always set
	[TKnex in Exclude<keyof Knex, keyof Knex.QueryBuilder>]: Knex[TKnex];
};

export type KnexTransactionProxy = KnexProxyFunction & SchemaName & {
	// Force QB to only come from the knex proxy to ensure the schema is always set
	[TKnexTransaction in Exclude<keyof Knex.Transaction, keyof Knex.QueryBuilder>]: Knex.Transaction[TKnexTransaction];
};

export type KnexProxy = KnexQueryProxy | KnexTransactionProxy;

export function createKnexProxy(instance: Knex.Transaction, database: Db): KnexTransactionProxy;
export function createKnexProxy(instance: Knex, database: Db): KnexQueryProxy;
export function createKnexProxy(instance: Knex | Knex.Transaction, database: Db): KnexProxy {
	const functionDeclaration = database
		? (table: string) => instance(table).withSchema(database)
		: (table: string) => instance(table);

	Object.assign(functionDeclaration, instance);
	(functionDeclaration as KnexProxy)[schemaName] = database;
	// @ts-expect-error All the properties are added through the previous lines
	return functionDeclaration;
}

export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: Db,
	transactionCallback?: null
): Promise<Knex.Transaction<any, TResponse>>;
export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: Db,
	transactionCallback: (context: KnexTransactionProxy) => Promise<TResponse>
): Promise<TResponse>;
// eslint-disable-next-line @typescript-eslint/promise-function-async
export function runInKnexTransactionProxy<TResponse>(
	knex: Knex,
	database: Db,
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

const hostMigrationVersions = new Map<Db, string>();

export async function getSchemaVersion(knex: KnexProxy) {
	const db = knex[schemaName];

	const cachedValue = hostMigrationVersions.get(db);
	if (cachedValue !== undefined) {
		return cachedValue;
	}

	const queryBuilder = knex('migrations');
	const {version} = await queryBuilder.count('* as version').first<{version: number}>();

	const freshValue = String(version);
	hostMigrationVersions.set(db, freshValue);
	return freshValue;
}
