// @ts-check
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('../../lib/shared/interfaces.js').RawExport} */
export const rawUserExport = JSON.parse(
	await readFile(
		path.resolve(
			root,
			'./raw-user-export.json',
		),
		'utf8',
	),
);

/** @type {import('../../lib/shared/interfaces.js').PublicExport} */
export const publicUserExport = JSON.parse(
	await readFile(
		path.resolve(
			root,
			'./public-user-export.json',
		),
		'utf8',
	),
);
