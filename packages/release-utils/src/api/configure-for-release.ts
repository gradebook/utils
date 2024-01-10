import process from 'process';
import {readFile} from 'fs/promises';
import path from 'path';
import {$ as zx$} from 'zx';

export interface PackageJson {
	name?: string;
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
	const fileContents = await readFile(path, 'utf8');
	return JSON.parse(fileContents) as JsonResponseType;
}

export async function configureForRelease(shaOrTagName: string, $ = zx$): Promise<{
	packageJson: PackageJson;
	isMergeRef: boolean;
}> {
	let changedFiles: string[];
	let isMergeRef: boolean;

	try {
		const rawParentData = await $`git rev-list --parents -1 ${shaOrTagName}`;
		isMergeRef = rawParentData.stdout.trim().split(' ').length > 2;
		const ref = isMergeRef ? `${shaOrTagName}^@` : shaOrTagName;

		const changedFilesRaw = await $`git log ${ref} --name-only --pretty= -1 --`;
		changedFiles = changedFilesRaw.stdout.trim().split('\n');
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

	return {packageJson, isMergeRef};
}
