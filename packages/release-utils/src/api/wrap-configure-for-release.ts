import {cwd} from 'process';
import {configureForRelease} from './configure-for-release.js';

export async function loudConfigureForRelease(commitOrTag: string) {
	const originalWd = cwd();
	const {packageJson, isMergeRef} = await configureForRelease(commitOrTag);

	const newWd = cwd();

	if (originalWd !== newWd) {
		console.log(`cwd: ${cwd()}`);
	}

	if (isMergeRef) {
		console.log(`${commitOrTag} is a merge commit, using parent tree`);
	}

	return packageJson;
}
