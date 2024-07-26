// @ts-check
import {readFile} from 'node:fs/promises';
import {after} from 'mocha';
import makeKnex from 'knex';

/** @type {ReturnType<typeof makeKnex>[]} */
const databases = [];

after(function () {
	for (const database of databases) {
		database.destroy();
	}
});

export function useDatabase() {
	const knex = makeKnex({
		client: 'sqlite3',
		useNullAsDefault: false,
		connection: {
			filename: ':memory:',
		},
	});

	databases.push(knex);

	return knex;
}

/**
 * @param {import('knex').Knex} knex
 * @param {string} filePath
 */
export async function runSqlFile(knex, filePath) {
	const fileContents = await readFile(filePath, 'utf8');
	const statements = fileContents.trim().split(';');

	for (const statement of statements) {
		if (!statement) { // Ignore th
			continue;
		}

		await knex.raw(`${statement};`); // eslint-disable-line no-await-in-loop
	}
}
