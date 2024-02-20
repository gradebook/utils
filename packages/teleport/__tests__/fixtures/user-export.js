import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('../../lib/exporter/raw').RawExportedUser} */
export const rawUserExport = JSON.parse(
	await readFile(
		path.resolve(
			root,
			'./raw-user-export.json',
		),
		'utf8',
	),
);

export const publicUserExport = JSON.parse(
	await readFile(
		path.resolve(
			root,
			'./public-user-export.json',
		),
		'utf8',
	),
);
