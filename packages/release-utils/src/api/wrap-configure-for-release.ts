import {configureForRelease} from './configure-for-release.js';

export async function loudConfigureForRelease(commitOrTag: string) {
	const {packageJson, isMergeRef} = await configureForRelease(commitOrTag);
	if (isMergeRef) {
		console.log(`${commitOrTag} is a merge commit, using parent tree`);
	}

	return packageJson;
}
