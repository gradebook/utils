export interface Category {
	name: string;
	weight: number;
	isReallyCategory: boolean;
	numGrades: number;
	droppedGrades: number;
}

export interface ApiCategory {
	name: string;
	weight: number;
	grades: number;
	position: number;
	dropped: number;
}
