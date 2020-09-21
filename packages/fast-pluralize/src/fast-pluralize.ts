// Ending pairs to use, in order of precedence
const endings = [
	['sis', 'sis'],
	['zzes', 'z'],
	['ies', 'y'],
	['s', '']
];

const OVERRIDES: {[plural: string]: string} = {
	bonuses: 'bonus'
};

export function singularize(phrase: string): string {
	phrase = phrase.trim();

	const phraseLower = phrase.toLowerCase();
	if (Object.hasOwnProperty.call(OVERRIDES, phraseLower)) {
		const newPhrase = OVERRIDES[phraseLower];
		// Try to preserve case
		if (phraseLower.startsWith(newPhrase)) {
			return phrase.slice(0, newPhrase.length);
		}

		return newPhrase;
	}

	// Loop through each pair and replace
	for (const [plural, singular] of endings) {
		if (phrase.endsWith(plural)) {
			return phrase.slice(0, phrase.length - plural.length) + singular;
		}
	}

	return phrase;
}
