// @ts-check
/* eslint-disable max-statements-per-line */

/**
 * Returns a struct with year and semester in readable format
 */

interface ReadableSemester {
	year: string;
	season: string;
}

export function readableSemester(semester: string): ReadableSemester {
	let season = '';
	const year = semester.slice(0, 4);
	const shortSeason = semester.slice(4, 5);

	switch (shortSeason) { // eslint-disable-line default-case
		case 'F': { season = 'Fall'; break; }
		case 'S': { season = 'Spring'; break; }
		case 'U': { season = 'Summer'; break; }
		case 'W': { season = 'Winter'; break; }
	}

	return {year, season};
}

export default readableSemester;
