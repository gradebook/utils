import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export async function importJson<TSchema extends Record<string, unknown>>(root: string, relative: string) {
	return JSON.parse(await readFile(
		path.resolve(path.dirname(fileURLToPath(root)), relative),
		'utf8',
	)) as TSchema;
}
