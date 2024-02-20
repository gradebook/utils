// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import oid from 'bson-objectid';
import {importer} from '../../lib/api.js';
import {rawUserExport, publicUserExport} from '../fixtures/user-export.js';

/**
 * Generator that yields object IDs in the same order (depth-first) to guarantee the public user export
 * will properly map to the raw user export
 */
function * objectId() {
	yield rawUserExport.user.id;
	let categoryIndex = 0;
	let gradeIndex = 0;
	for (const course of rawUserExport.courses) {
		yield course.id;

		for (;rawUserExport.categories[categoryIndex]?.course_id === course.id; categoryIndex++) {
			const category = rawUserExport.categories[categoryIndex];
			yield category.id;

			for (;rawUserExport.grades[gradeIndex]?.category_id === category.id; gradeIndex++) {
				yield rawUserExport.grades[gradeIndex].id;
			}
		}
	}
}

describe('Unit > Importer', function () {
	it('generateAPICalls with a v0 export', function () {
		const genId = objectId();
		const stub = sinon.stub(oid.prototype, 'toHexString').callsFake(() => {
			const {value, done} = genId.next();
			expect(done).to.equal(false);
			return value;
		});

		try {
			expect(
				importer.generateAPICalls(publicUserExport, {schemaVersion: rawUserExport.version, gid: rawUserExport.user.gid}),
			).to.deep.equal(rawUserExport);
			expect(genId.next().done).to.be.true;
		} finally {
			stub.restore();
		}
	});
});
