// Ending pairs to use, in order of precedence
const endings = [
	['sis', 'sis'],
	['zzes', 'z'],
	['ies', 'y'],
	['s', '']
];

export function singularize(phrase: string): string {
	phrase = phrase.trim();

	// Loop through each pair and replace
	for (const [plural, singular] of endings) {
		if (phrase.endsWith(plural)) {
			phrase = phrase.slice(0, phrase.length - plural.length) + singular;
			break;
		}
	}

	return phrase;
}
