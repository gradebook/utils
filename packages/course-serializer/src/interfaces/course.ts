import {Category} from './category';

export interface Iv0Course {
	name: string;
	credits: number;
	cut1: number;
	cut1Name: string;
	cut2: number;
	cut2Name: string;
	cut3: number;
	cut3Name: string;
	cut4: number;
	cut4Name: string;
	categories: Category[];
}

export interface Course {
	name: string;
	credits: number;
	cutoffs: Cutoffs;
	categories: Category[];
}

export interface Cutoffs {
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
}
