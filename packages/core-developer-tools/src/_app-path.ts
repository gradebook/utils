import path from 'path';

export function appPath(subdir: string) {
	const response = path.resolve('/__dev__/', subdir.replace(/^\//, ''));

	if (subdir.endsWith('/')) {
		return `${response}/`;
	}

	return response;
}
