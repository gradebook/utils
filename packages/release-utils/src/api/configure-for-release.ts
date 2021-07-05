import {readFile} from 'fs/promises';
import path from 'path';
import {$ as zx$} from 'zx';

export interface PackageJson {
	version?: string;
	scripts?: {
		prepublish?: string;
	};
}

export class ConfigureForReleaseError extends Error {
	isReleaseUtilsError = true;
}

export async function importJson<JsonResponseType extends Record<string, any>>(
	path: string,
): Promise<JsonResponseType> {
	const fileContents = await readFile(path, 'utf-8');
	return JSON.parse(fileContents) as JsonResponseType;
}

export async function configureForRelease(shaOrTagName: string, $ = zx$): Promise<PackageJson> {
	let changedFiles: string[];

	try {
		changedFiles = (await $`git log ${shaOrTagName} --name-only --pretty= -1 --`).stdout.trim().split('\n');
	} catch {
		/* eslint-disable-next-line unicorn/no-process-exit */
		process.exit(1);
	}

	let packageFile: string | null = null;

	for (const file of changedFiles) {
		if (file.endsWith('package.json')) {
			packageFile = file;
			break;
		}
	}

	if (!packageFile) {
		throw new ConfigureForReleaseError(`Unable to find package file. Commit sha: ${shaOrTagName}`);
	}

	const packageJson = await importJson<PackageJson>(path.resolve(process.cwd(), packageFile));
	process.chdir(path.dirname(packageFile));

	return packageJson;
}
