import {$ as zx$} from 'zx';
import type {PackageJson} from './configure-for-release.js';

// Pulled from https://semver.org/ - if we run into issues, we can use the
// npm semver package
/* eslint-disable-next-line unicorn/better-regex */
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

async function getTagNameFromRef(ref: string, $ = zx$) {
	const rawResponse = await $`git tag --points-at ${ref}`;
	return rawResponse.stdout.trim().split('\n').shift();
}

export function getReleaseTag(candidate: string) {
	const parts = SEMVER_REGEX.exec(candidate);
	// 4 is the index with the pre-release tag
	if (!parts || !parts[4]) {
		return 'latest';
	}

	return parts[4].split('.').shift();
}

export class PublishPackageError extends Error {
	isReleaseUtilsError = true;
}

export async function resolveTagName(shaOrTagName: string, packageJson: PackageJson, $ = zx$): Promise<string | undefined> {
	const possibleTagNames = [
		shaOrTagName, // Examples: v1.0.0, b4a7497060c332607f9465b84427a35aca11359e
		`v${packageJson.version}`, // Example: v1.0.0
		`${packageJson.name}@v${packageJson.version}`, // Example: @gradebook/release-utils@v1.0.0
	];

	for (const maybeTag of possibleTagNames) {
		// eslint-disable-next-line no-await-in-loop
		const tag = await getTagNameFromRef(maybeTag, $);

		if (tag) {
			return tag;
		}
	}
}

/**
 * @returns the associated Git tag name for the release
 */
export async function publishPackage(shaOrTagName: string, packageJson: PackageJson, $ = zx$): Promise<string> {
	const tagName = await resolveTagName(shaOrTagName, packageJson, $);
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

	await $`yarn publish --non-interactive --new-version ${version} --tag ${getReleaseTag(version)} --access public`;
	return tagName;
}
