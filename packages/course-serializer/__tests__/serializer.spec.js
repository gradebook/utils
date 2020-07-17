// @ts-check
const {expect} = require('chai');
const serializer = require('../lib/commonjs/course-serializer');

const getSafeCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-serialized-course.json')));
const getExampleCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-course.json')));

const SERIALIZED_COURSE = 'eyJtIjoiMXwyMDIwfDB8NHxBLDkwfEIsODB8Qyw3MHxELDYwfEV4YW1wbGUgQ291cnNlIiwieiI6WyIxfDB8MjB8MHxBdHRlbmRhbmNlIiwiMXwwfDEzfDF8T25saW5lIFF1aXp6ZXMiLCIxfDB8NHw1fEN1bHR1cmFsIERpc2NvdXJzZSBKb3VybmFsIiwiMHwwfDF8MjB8RXhhbSAxIiwiMHwwfDF8MjB8RXhhbSAyIiwiMHwwfDF8NXxJbml0aWFsIEVzc2F5IiwiMHwwfDF8MTV8RmluYWwgRXNzYXkiLCIxfDB8MnwxMHxTaG9ydCBQYXBlciIsIjB8MHwxfDV8UGFydGljaXBhdGlvbiIsIjB8MHwxfDV8UHJlc2VudGF0aW9uIiwiMHwwfDF8MTV8T25saW5lIFF1aXp6ZXMgYWZ0ZXIgZHJvcHBlZCJdfQ==';

describe('Unit > Serializer', function () {
	it('strip properly removes PII from a category', function () {
		const exampleCourse = getExampleCourse();
		const safeCourse = getSafeCourse();

		delete safeCourse.year;
		delete safeCourse.version;

		expect(serializer.strip(exampleCourse)).to.deep.equal(safeCourse);
	});

	it('hash deserialization produces a safe course', function () {
		expect(serializer.deserialize(SERIALIZED_COURSE)).to.deep.equal(getSafeCourse());
	});

	it('course serialization produces the correct hash', function () {
		expect(serializer.serialize(serializer.strip(getExampleCourse()))).to.equal(SERIALIZED_COURSE);
	});

	it('category serialization removes invalid categories', function () {
		expect(serializer._serializeCategory({
			name: null,
			weight: null,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true
		}), 'no name or weight').to.equal(null);

		expect(serializer._serializeCategory({
			name: 'Homework',
			weight: null,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true
		}), 'name but no weight').to.equal(null);

		expect(serializer._serializeCategory({
			name: null,
			weight: 25,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true
		}), 'weight but no name').to.equal(null);

		expect(serializer._serializeCategory({
			name: 'Homework',
			weight: 25,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true
		}), 'name and weight').to.equal('1|5|10|25|Homework');
	});
});
