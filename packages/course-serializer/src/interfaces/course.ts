import {Category} from './category';

export interface Course {
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
