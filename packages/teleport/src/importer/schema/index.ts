import {importJson} from '../../shared/import-json.js';

const [v0, cutoffs, course, category, grade] = await Promise.all([
	importJson(import.meta.url, './v0.json'),
	importJson(import.meta.url, './cutoffs.json'),
	importJson(import.meta.url, './course.json'),
	importJson(import.meta.url, './category.json'),
	importJson(import.meta.url, './grade.json'),
]);

export const SCHEMAS = [
	grade,
	category,
	course,
	v0,
	cutoffs,
];

export default SCHEMAS;
