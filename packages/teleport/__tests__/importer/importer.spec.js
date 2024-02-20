// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import oid from 'bson-objectid';
import {importer} from '../../lib/api.js';
import {importJson} from '../../lib/shared/import-json.js';
import {rawUserExport} from '../fixtures/raw-user-export.js';

const exampleExport = await importJson(import.meta.url, './example-export.json');

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
				importer.generateAPICalls(exampleExport, {schemaVersion: rawUserExport.version, gid: rawUserExport.user.gid}),
			).to.deep.equal(rawUserExport);
			expect(genId.next().done).to.be.true;
		} finally {
			stub.restore();
		}
	});
});
