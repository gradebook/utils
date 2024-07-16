/* eslint-disable @typescript-eslint/member-ordering */

export const semesterSortOrder = {
	Spring: 1,
	Summer: 2,
	Fall: 3,
	Winter: 4,
};

export type SemesterSeason = keyof typeof semesterSortOrder;

export interface ParsedSemester {
	year: number;
	season: SemesterSeason;
	emoji: string;
}

/**
 * Represents a semester with a given year and season.
 */
export class Semester {
	/**
	 * 5-character semester identifier (e.g. 2020F, 2034S, etc.)
	 */
	readonly raw: string;

	/**
	 * 4-digit year
	 */
	readonly year: number;

	/**
	 * Number representing expected order in a year (spring = 1, summer = 2, etc.)
	 */
	readonly semesterNumber: number;
	private readonly _parsed: ParsedSemester | null;

	constructor(value: string) {
		if (!value) {
			this.raw = '';
			this.year = -1;
			this.semesterNumber = -1;
			this._parsed = null;
			return;
		}

		value = value.toUpperCase();
		const parsedSemester = Semester.parse(value);

		if (!parsedSemester) {
			throw new Error(`Semester "${value}" is not a valid semester`);
		}

		this._parsed = parsedSemester;
		this.raw = value;
		this.year = parsedSemester.year;
		this.semesterNumber = semesterSortOrder[this._parsed.season];
	}

	/**
	 * Checks if the given string is a valid 5-character semester identifier
	 *
	 * @param {string} questionable - String to validate
	 */
	static isSemester(questionable: string): boolean {
		return questionable.length === 5 && /\d{4}[sufw]/i.test(questionable);
	}

	/**
	 * Parses a 5-character semester code and returns a structure with year, season, and icon
	 *
	 * @param {string} string - 5-character semester code
	 * @returns {ParsedSemester | false} Parsed semester or false if invalid
	 */
	static parse(semester: string): ParsedSemester | false {
		if (semester.length !== 5) {
			return false;
		}

		let season: SemesterSeason | undefined;
		let emoji = '';
		const year = Number(semester.slice(0, 4));
		const shortSeason = semester.slice(4, 5);

		// eslint-disable-next-line unicorn/prefer-switch
		if (shortSeason === 'F') {
			season = 'Fall';
			emoji = '🍁';
		} else if (shortSeason === 'S') {
			season = 'Spring';
			emoji = '🌷';
		} else if (shortSeason === 'U') {
			season = 'Summer';
			emoji = '☀️';
		} else if (shortSeason === 'W') {
			season = 'Winter';
			emoji = '❄️';
		}

		if (!year || !season) {
			return false;
		}

		return {
			year,
			season,
			emoji,
		};
	}

	/**
	 * Returns the semester year, season, and emoji (optional) as a string
	 *
	 * @param {boolean} [includeEmoji=false] - Whether to include the season emoji in string
	 * @returns {string} Parsed semester or false if invalid
	 */
	toString(includeEmoji = false): string {
		if (!this._parsed) {
			return 'Semesters';
		}

		const emoji = includeEmoji ? ` ${this._parsed.emoji}` : '';

		return `${this._parsed.season} ${this._parsed.year}${emoji}`;
	}
}
