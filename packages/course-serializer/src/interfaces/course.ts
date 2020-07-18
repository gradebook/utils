import {Category} from './category';

export interface Course {
	name: string;
	credits: number;
	cutoffs: Cutoffs;
	categories: Category[];
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
