import {Category} from './category';

export interface Course {
	name: string;
	credits: number;
	cut1: number;
	cut2: number;
	cut3: number;
	cut4: number;
	categories: Category[];
}
