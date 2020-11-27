/* eslint-disable camelcase */
export type MinimalCourse = {
	semester: string;
	name: string;
	cutoffs: string;
	credit_hours: string;
};

export type MinimalCategory = {
	name: string;
	weight: number;
	position: number;
	dropped_grades: number;
};

export type MinimalGrade = {
	name: string;
	grade: number;
};

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

export interface CourseRow extends MinimalCourse {
	id: string;
	user_id: string;
}

export interface CategoryRow extends MinimalCategory {
	id: string;
	course_id: string;
}

export interface GradeRow extends MinimalGrade {
	id: string;
	user_id: string;
	course_id: string;
	category_id: string;
}

export interface UserRow {
	id: string;
	gid: string;
	firstName: string;
	lastName: string;
	created_at: string;
	updated_at: string;
	email: string;
	settings: string;
}

type CourseQuery = ['courses', CourseRow];
type CategoryQuery = ['categories', CategoryRow];
type GradeQuery = ['grades', GradeRow];
type UserQuery = ['users', UserRow];
export type Query = CourseQuery | CategoryQuery | GradeQuery | UserQuery;

export interface Course extends MinimalCourse {
	categories?: Category[];
}

export interface Category extends MinimalCategory {
	grades?: Grade[];
}

export type Grade = MinimalGrade;

export interface Export {
	version: '0';
	courses?: Course[];
	user: {
		firstName: string;
		lastName: string;
		email: string;
		settings: string;
		created_at: string;
		updated_at: string;
	};
}
