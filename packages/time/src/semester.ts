// @ts-check

import {dayjs} from './index.js';

/** The number of days earlier than client to enable a semester as active in server. */
const SERVER_EARLY_ACTIVE_DAYS = 1;
/** The number of days later than client to keep a semester enabled as active in server. */
const SERVER_LATE_ACTIVE_DAYS = 7;

// Months are 0-indexed in Date objects
const JANUARY = 0;
const MARCH = 2;
const MAY = 4;
const JUNE = 5;
const AUGUST = 7;
const NOVEMBER = 10;
const DECEMBER = 11;

type CurrentSemesterState = {
	primarySemester: string;
	activeSemesters: string[];
	serverAllowedSemesters: string[];
};

export const data: CurrentSemesterState = {
	primarySemester: null,
	activeSemesters: [],
	serverAllowedSemesters: [],
};

/**
 * Compute active semesters
 *
 * Active semester timeline:
 *
 * November 1 (prior) - June 10 = Spring;
 *
 * March 25 - August 31 = Summer;
 *
 * March 25 - December 31 = Fall;
 *
 * November 1 - January 20 (future) = Winter;
 */
type SemesterActiveFunction = (year: number) => {start: Date; end: Date};

const getSpringActiveRange: SemesterActiveFunction = (year: number) => {
	const start = new Date(year - 1, NOVEMBER, 1);
	const end = new Date(year, JUNE, 10);
	return {start, end};
};

const getSummerActiveRange: SemesterActiveFunction = (year: number) => {
	const start = new Date(year, MARCH, 25);
	const end = new Date(year, AUGUST, 31);
	return {start, end};
};

function getFallActiveRange(year: number) {
	const start = new Date(year, MARCH, 25);
	const end = new Date(year, DECEMBER, 31);
	return {start, end};
}

function getWinterActiveRange(year: number) {
	const start = new Date(year, NOVEMBER, 1);
	const end = new Date(year + 1, JANUARY, 20);
	return {start, end};
}

function isDateInActiveRange(start: Date, end: Date, candidate: Date) {
	return candidate >= start && candidate <= end;
}

function isDateInServerWidenedRange(originalStart: Date, originalEnd: Date, candidate: Date) {
	const start = dayjs(originalStart).subtract(SERVER_EARLY_ACTIVE_DAYS, 'day').toDate();
	const end = dayjs(originalEnd).add(SERVER_LATE_ACTIVE_DAYS, 'days').toDate();
	return candidate >= start && candidate <= end;
}

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

function _computeActiveSemesters(currentYear: number, currentDate: Date) {
	const {start: priorWinterStart, end: priorWinterEnd} = getWinterActiveRange(currentYear - 1);
	const {start: springStart, end: springEnd} = getSpringActiveRange(currentYear);
	const {start: summerStart, end: summerEnd} = getSummerActiveRange(currentYear);
	const {start: fallStart, end: fallEnd} = getFallActiveRange(currentYear);
	const {start: winterStart, end: winterEnd} = getWinterActiveRange(currentYear);
	const {start: futureSpringStart, end: futureSpringEnd} = getSpringActiveRange(currentYear + 1);

	// The previous year's winter may still be active or the next semester's spring since they overlap.
	data.activeSemesters = [
		isDateInActiveRange(priorWinterStart, priorWinterEnd, currentDate) ? `${currentYear - 1}W` : null,
		isDateInActiveRange(springStart, springEnd, currentDate) ? `${currentYear}S` : null,
		isDateInActiveRange(summerStart, summerEnd, currentDate) ? `${currentYear}U` : null,
		isDateInActiveRange(fallStart, fallEnd, currentDate) ? `${currentYear}F` : null,
		isDateInActiveRange(winterStart, winterEnd, currentDate) ? `${currentYear}W` : null,
		isDateInActiveRange(futureSpringStart, futureSpringEnd, currentDate) ? `${currentYear + 1}S` : null,
	].filter(Boolean);

	// The previous year's winter may still be allowed or the next semester's spring since they overlap.
	data.serverAllowedSemesters = [
		isDateInServerWidenedRange(priorWinterStart, priorWinterEnd, currentDate) ? `${currentYear - 1}W` : null,
		isDateInServerWidenedRange(springStart, springEnd, currentDate) ? `${currentYear}S` : null,
		isDateInServerWidenedRange(summerStart, summerEnd, currentDate) ? `${currentYear}U` : null,
		isDateInServerWidenedRange(fallStart, fallEnd, currentDate) ? `${currentYear}F` : null,
		isDateInServerWidenedRange(winterStart, winterEnd, currentDate) ? `${currentYear}W` : null,
		isDateInServerWidenedRange(futureSpringStart, futureSpringEnd, currentDate) ? `${currentYear + 1}S` : null,
	].filter(Boolean);
}

export function computeSemesterData() {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();
	const currentDay = currentDate.getDate();

	data.primarySemester = _getPrimarySemester(currentMonth, currentDay, currentYear);
	_computeActiveSemesters(currentYear, currentDate);
}

computeSemesterData();

export default data;

export function __testHelper() {
	return {
		getSpringActiveRange,
		getSummerActiveRange,
		getFallActiveRange,
		getWinterActiveRange,
		isDateInActiveRange,
		_getPrimarySemester,
	};
}
