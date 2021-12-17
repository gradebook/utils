export const MAX_CATEGORY_NAME_LENGTH = 50;
export const MAX_WEIGHT = 999_999;
export const MAX_CREDITS = 9;
export const MAX_GRADES_PER_CATEGORY = 40;
export const MIN_CUTOFF = 10;
export const MAX_CUTOFF = 10_000;

export const COURSE_NAME = /^[a-z]{3,4}[- ]\d{3,4}$/i;
export const CUTOFFS = new Set(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']);
export const SEMESTER = /^\d{4}[sufw]$/i;

/** Not directly used */
export const MAX_CATEGORIES_PER_COURSE = 25;
export const MAX_COURSES_PER_SEMESTER = 8;
