interface ReleaseNotesEntry {
	version: string;
	notes: string;
}

const extractContents = (changelogSnippet: string): ReleaseNotesEntry => {
	const firstNewlineIndex = changelogSnippet.indexOf('\n');
	const notes = changelogSnippet.slice(firstNewlineIndex);
	let version = changelogSnippet.slice(changelogSnippet.indexOf('#') + 1, firstNewlineIndex).trim();

	if (version.startsWith('[')) {
		version = version.slice(1, version.indexOf(']'));
	}

	if (!version || !version.includes('.')) {
		return null;
	}

	return {
		version: version.trim(),
		notes: notes.replace(/^\n+/, '').trimEnd()
	};
};

export default function getReleaseNotes(changelog: string): ReleaseNotesEntry {
	const firstHashIndex = changelog.indexOf('#');
	const secondHashIndex = changelog.indexOf('#', firstHashIndex + 1);

	const firstRelease = extractContents(changelog.slice(firstHashIndex, secondHashIndex));

	if (firstRelease) {
		return firstRelease;
	}

	const thirdHashIndex = changelog.indexOf('#', secondHashIndex + 1);
	const secondRelease = extractContents(changelog.slice(secondHashIndex, thirdHashIndex));

	if (secondRelease) {
		return secondRelease;
	}

	throw new Error('Unable to extract release notes');
}
