
export interface MinimalCourse {
	semester: string;
	name: string;
	cutoffs: string;
	credit_hours: string;
	settings: string;
}

export interface MinimalCategory {
	name: string;
	weight: number;
	position: number;
	dropped_grades: number;
}

export interface MinimalGrade {
	name: string | null;
	grade: number | null;
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

export interface ExportedUserRow {
	firstName: string;
	lastName: string;
	created: string;
	updated: string;
	email: string;
	settings: string;
}

// Extend the exported row to explicitly track the differences
interface UserRowWithAdditionalProperties extends ExportedUserRow {
	id: string;
	gid: string;
	donated_at: string | null;
	total_school_changes: number | null;
	first_name: string;
	last_name: string;
	created_at: string;
	updated_at: string;
}

export type UserRow = Omit<UserRowWithAdditionalProperties, 'firstName' | 'lastName' | 'created' | 'updated'>;

type CourseQuery = ['courses', CourseRow];
type CategoryQuery = ['categories', CategoryRow];
type GradeQuery = ['grades', GradeRow];
type UserQuery = ['users', ExportedUserRow];
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
