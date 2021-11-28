export interface Category {
	name: string;
	weight: number;
	isReallyCategory: boolean;
	numGrades: number;
	droppedGrades: number | null;
}

export interface ApiCategory {
	name: string;
	weight: number;
	numGrades: number;
	position: number;
	dropped: number;
}
