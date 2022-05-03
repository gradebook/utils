// @ts-check

const JANUARY = 1;
const MAY = 5;
const JUNE = 6;
const AUGUST = 8;
const DECEMBER = 12;

type CurrentSemesterState = {
	primarySemester: string;
	allowedSemesters: string[];
};

export const data: CurrentSemesterState = {
	primarySemester: null,
	allowedSemesters: [],
};

type SemesterAllowedFunction = (currentMonth: number, currentDay: number, currentYear: number) => string;

// Spring is active from December 15 of the previous year to June 15
const isSpringAllowed: SemesterAllowedFunction = (currentMonth, currentDay, currentYear) => {
	const isAllowedDecemberDay = currentMonth === DECEMBER && currentDay >= 15;
	const isAllowedJuneDay = currentMonth === JUNE && currentDay <= 15;
	const isAllowed = isAllowedDecemberDay || isAllowedJuneDay || currentMonth < JUNE;
	const year = currentMonth === DECEMBER ? currentYear + 1 : currentYear;

	return isAllowed ? `${year}S` : null;
};

// Summer is active from May 1 to August 31
const isSummerAllowed: SemesterAllowedFunction = (currentMonth, currentDay, currentYear) => {
	const isAllowedMayDay = currentMonth === MAY && currentDay >= 1;
	const isAllowedAugustDay = currentMonth === AUGUST && currentDay <= 31;
	const isAllowed = isAllowedMayDay || isAllowedAugustDay || (currentMonth > MAY && currentMonth < AUGUST);

	return isAllowed ? `${currentYear}U` : null;
};

// Fall is active from August 1 to December 28
const isFallAllowed: SemesterAllowedFunction = (currentMonth, currentDay, currentYear) => {
	const isAllowedAugustDay = currentMonth === AUGUST && currentDay >= 1;
	const isAllowedDecemberDay = currentMonth === DECEMBER && currentDay <= 28;
	const isAllowed = isAllowedAugustDay || isAllowedDecemberDay || (currentMonth > AUGUST && currentMonth < DECEMBER);

	return isAllowed ? `${currentYear}F` : null;
};

// Winter is active from December 1 to January 31 of the following year
const isWinterAllowed: SemesterAllowedFunction = (currentMonth, currentDay, currentYear) => {
	const isAllowedDecemberDay = currentMonth === DECEMBER && currentDay >= 1;
	const isAllowedJanuaryDay = currentMonth === JANUARY && currentDay <= 31;
	const isAllowed = isAllowedDecemberDay || isAllowedJanuaryDay;
	const year = currentMonth === JANUARY ? currentYear - 1 : currentYear;

	return isAllowed ? `${year}W` : null;
};

/**
 * Compute the primary semester
 *
 * Primary semester timeline:
 *
 * January 10 - May 27 = Spring;
 *
 * May 28 - August 17 = Summer;
 *
 * August 17 - December 20 = Fall;
 *
 * December 21 - January 09 = Winter;
 */
function _getPrimarySemester(currentMonth: number, currentDay: number, currentYear: number): string {
	// CASE: January to May
	if (currentMonth <= MAY) {
		// CASE: Before January 10 -> Winter of LAST year
		if (currentMonth === JANUARY && currentDay < 10) {
			return `${currentYear - 1}W`;
		}

		// CASE: After May 27 -> Summer
		if (currentMonth === MAY && currentDay > 27) {
			return `${currentYear}U`;
		}

		// CASE: Spring
		return `${currentYear}S`;
	}

	// CASE: Up to August
	if (currentMonth <= AUGUST) {
		// CASE: AFTER August 16 -> Fall
		if (currentMonth === AUGUST && currentDay > 16) {
			return `${currentYear}F`;
		}

		// CASE: BEFORE (or on) August 16 -> Summer
		return `${currentYear}U`;
	}

	// CASE: NOT December -> Fall
	if (currentMonth !== DECEMBER) {
		return `${currentYear}F`;
	}

	// CASE: After December 20 -> Winter
	if (currentDay > 20) {
		return `${currentYear}W`;
	}

	// CASE: In December but on or before December 20 -> Fall
	return `${currentYear}F`;
}

export function computeSemesterData() {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;
	const currentDay = currentDate.getDate();

	data.primarySemester = _getPrimarySemester(currentMonth, currentDay, currentYear);
}

computeSemesterData();

export default data;

export function __testHelper() {
	return {
		isSpringAllowed,
		isSummerAllowed,
		isFallAllowed,
		isWinterAllowed,
		_getPrimarySemester,
	};
}
