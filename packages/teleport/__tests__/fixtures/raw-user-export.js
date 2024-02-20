import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

/** @type {import('../../lib/exporter/raw.d.ts').RawExportedUser} */
export const rawUserExport = JSON.parse(
	await readFile(
		path.resolve(
			path.dirname(fileURLToPath(import.meta.url)),
			'./raw-user-export.json',
		),
		'utf8',
	),
);
