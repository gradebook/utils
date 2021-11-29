import {Category, ApiCategory} from './category.js';

export interface Course {
	name: string;
	credits: number;
	cutoffs: Cutoffs;
	categories: Category[];
}

export interface ApiCourse {
	course: {
		name: string;
		semester: string;
		credits: number;
		cutoffs: string;
	};
	categories: ApiCategory[];
}

export type Cutoffs = {
	'A+'?: number;
	A?: number;
	'A-'?: number;
	'B+'?: number;
	B?: number;
	'B-'?: number;
	'C+'?: number;
	C?: number;
	'C-'?: number;
	'D+'?: number;
	D?: number;
	'D-'?: number;
};
