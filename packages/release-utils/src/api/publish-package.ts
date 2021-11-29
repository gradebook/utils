import {$ as zx$} from 'zx';
import type {PackageJson} from './configure-for-release.js';

export class PublishPackageError extends Error {
	isReleaseUtilsError = true;
}

export async function publishPackage(shaOrTagName: string, packageJson: PackageJson, $ = zx$) {
	// This will resolve a tag name OR a sha to a tag name
	const tagNameRaw = await $`git tag --points-at ${shaOrTagName}`;
	const tagName = tagNameRaw.stdout.trim().split('\n').shift();
	const {version} = packageJson;

	// CASE: for whatever reason the package version is empty
	// CASE: tagname and version number don't match
	//       note that tagged versions are not supported at this time
	if (!version || !tagName?.endsWith(version)) {
		throw new PublishPackageError(
			`Tag name ${tagName} does not match with version in package.json (${version})`,
		);
	}

	if (!packageJson.scripts?.prepublish) {
		throw new PublishPackageError(
			'Package is missing a prepublish script. Prepublish scripts are mandatory for hands-free release',
		);
	}

	await $`yarn publish --non-interactive --new-version ${version} --access public`;
}
