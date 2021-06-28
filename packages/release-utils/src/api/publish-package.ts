import {readFile} from 'fs/promises';
import path from 'path';
import {$ as zx$} from 'zx';

interface PackageJson {
	version?: string;
	scripts?: {
		prepublish?: string;
	};
}

export class PublishPackageError extends Error {
	isReleaseUtilsError = true;
}

export async function importJson<JsonResponseType extends Record<string, any>>(
	path: string
): Promise<JsonResponseType> {
	const fileContents = await readFile(path, 'utf-8');
	return JSON.parse(fileContents) as JsonResponseType;
}

export async function publishPackage(shaOrTagName: string, $ = zx$) {
	const changedFiles = (await $`git log ${shaOrTagName} --name-only --pretty="" -1 --`).stdout.trim().split('\n');

	let packageFile: string = null;

	for (const file of changedFiles) {
		if (file.endsWith('package.json')) {
			packageFile = file;
			break;
		}
	}

	if (!packageFile) {
		throw new PublishPackageError(`Unable to find package file. Commit sha: ${shaOrTagName}`);
	}

	const packageJson = await importJson<PackageJson>(path.resolve(process.cwd(), packageFile));
	process.chdir(path.dirname(packageFile));

	// This will resolve a tag name OR a sha to a tag name
	const tagName = (await $`git tag --points-at ${shaOrTagName}`).stdout.trim().split('\n').shift();
	const {version} = packageJson;

	// CASE: for whatever reason the package version is empty
	// CASE: tagname and version number don't match
	//       note that tagged versions are not supported at this time
	if (!version || !tagName.endsWith(version)) {
		throw new PublishPackageError(
			`Tag name ${tagName} does not match with version in package.json (${version})`
		);
	}

	if (!packageJson.scripts?.prepublish) {
		throw new PublishPackageError(
			'Package is missing a prepublish script. Prepublish scripts are mandatory for hands-free release'
		);
	}

	await $`yarn publish --non-interactive --new-version ${version} --access public`;
}
