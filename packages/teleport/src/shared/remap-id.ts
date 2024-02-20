import objectId from 'bson-objectid';
import {type RawExport} from '../shared/interfaces.js';

const createSingleUpdater = (remappedIds: Map<string, string>) => (object: {id: string}) => {
	const id = objectId().toHexString();
	remappedIds.set(object.id, id);
	object.id = id;
	return id;
};

export function remapRawExportIds(userExport: RawExport) {
	const remappedIds = new Map<string, string>();
	const remapSingle = createSingleUpdater(remappedIds);
	const userId = remapSingle(userExport.user);
	userExport.user.id = userId;
	remappedIds.set(userExport.user.id, userId);

	/* eslint-disable camelcase */
	for (const course of userExport.courses) {
		remapSingle(course);
		course.user_id = userId;
	}

	for (const category of userExport.categories) {
		remapSingle(category);
		category.course_id = remappedIds.get(category.course_id)!;
	}

	for (const grade of userExport.grades) {
		remapSingle(grade);
		grade.user_id = remappedIds.get(grade.user_id)!;
		grade.course_id = remappedIds.get(grade.course_id)!;
		grade.category_id = remappedIds.get(grade.category_id)!;
	}
	/* eslint-enable camelcase */
}
