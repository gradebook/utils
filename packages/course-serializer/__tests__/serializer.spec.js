// @ts-check
import {readFileSync} from 'fs';
import {expect} from 'chai';
import * as serializer from '../lib/course-serializer.js';

const exampleSerializedCourse = readFileSync(new URL('../fixtures/example-serialized-course.json', import.meta.url), 'utf8');
const exampleCourse = readFileSync(new URL('../fixtures/example-course.json', import.meta.url), 'utf8');

const getSafeCourse = () => JSON.parse(exampleSerializedCourse);
const getExampleCourse = () => JSON.parse(exampleCourse);

// The only thing that should change is the letter after `eyJtIjoiMXwyMDI` since it's year-dependent

const SERIALIZED_COURSE = 'eyJtIjoiMXwyMDIxfDB8NHxBLDkwfEIsODB8Qyw3MHxELDYwfEV4YW1wbGUgQ291cnNlIiwieiI6WyIxfDB8MjB8MHxBdHRlbmRhbmNlIiwiMXwwfDEzfDF8T25saW5lIFF1aXp6ZXMiLCIxfDB8NHw1fEN1bHR1cmFsIERpc2NvdXJzZSBKb3VybmFsIiwiMHwwfDF8MjB8RXhhbSAxIiwiMHwwfDF8MjB8RXhhbSAyIiwiMHwwfDF8NXxJbml0aWFsIEVzc2F5IiwiMHwwfDF8MTV8RmluYWwgRXNzYXkiLCIxfDB8MnwxMHxTaG9ydCBQYXBlciIsIjB8MHwxfDV8UGFydGljaXBhdGlvbiIsIjB8MHwxfDV8UHJlc2VudGF0aW9uIiwiMHwwfDF8MTV8T25saW5lIFF1aXp6ZXMgYWZ0ZXIgZHJvcHBlZCJdfQ==';

describe('Unit > Serializer', function () {
	it('strip properly removes PII from a category', function () {
		const exampleCourse = getExampleCourse();
		const safeCourse = getSafeCourse();

		delete safeCourse.year;
		delete safeCourse.version;

		expect(serializer.strip(exampleCourse)).to.deep.equal(safeCourse);
	});

	it('separateMetadata', function () {
		const json = serializer.isomorphicAtoB(SERIALIZED_COURSE);
		expect(serializer.separateMetadata(json)).to.deep.equal({
			metadata: '1|2021',
			course: '{"m":"0|4|A,90|B,80|C,70|D,60|Example Course","z":["1|0|20|0|Attendance","1|0|13|1|Online Quizzes","1|0|4|5|Cultural Discourse Journal","0|0|1|20|Exam 1","0|0|1|20|Exam 2","0|0|1|5|Initial Essay","0|0|1|15|Final Essay","1|0|2|10|Short Paper","0|0|1|5|Participation","0|0|1|5|Presentation","0|0|1|15|Online Quizzes after dropped"]}',
		});
	});

	it('joinMetadata', function () {
		expect(serializer.joinMetadata(
			'1|2021',
			'{"m":"0|4|A,90|B,80|C,70|D,60|Example Course","z":["1|0|20|0|Attendance","1|0|13|1|Online Quizzes","1|0|4|5|Cultural Discourse Journal","0|0|1|20|Exam 1","0|0|1|20|Exam 2","0|0|1|5|Initial Essay","0|0|1|15|Final Essay","1|0|2|10|Short Paper","0|0|1|5|Participation","0|0|1|5|Presentation","0|0|1|15|Online Quizzes after dropped"]}',
		)).to.equal(serializer.isomorphicAtoB(SERIALIZED_COURSE));
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
			isReallyCategory: true,
		}), 'no name or weight').to.equal(null);

		expect(serializer._serializeCategory({
			name: 'Homework',
			weight: null,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true,
		}), 'name but no weight').to.equal(null);

		expect(serializer._serializeCategory({
			name: null,
			weight: 25,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true,
		}), 'weight but no name').to.equal(null);

		expect(serializer._serializeCategory({
			name: 'Homework',
			weight: 25,
			numGrades: 10,
			droppedGrades: 5,
			isReallyCategory: true,
		}), 'name and weight').to.equal('1|5|10|25|Homework');
	});

	it('prepareForCourseAPI', function () {
		expect(
			serializer.prepareCourseForAPI({
				categories: [
					{name: 'Homework', droppedGrades: 4, isReallyCategory: true, weight: 15, numGrades: 10},
					{name: 'Quizzes', droppedGrades: 1, isReallyCategory: true, weight: 25, numGrades: 5},
					{name: 'Labs', droppedGrades: 0, isReallyCategory: true, weight: 15, numGrades: 8},
					{name: 'Final', droppedGrades: 0, isReallyCategory: false, weight: 45, numGrades: 1},
				],
				credits: 4,
				name: 'LEARN 115',
				cutoffs: {A: 90, B: 80},
			}, '2020F'),
		).to.deep.equal({
			course: {
				name: 'LEARN 115',
				semester: '2020F',
				credits: 4,
				cutoffs: '{"A":90,"B":80}',
			},
			categories: [
				{name: 'Homework', dropped: 4, weight: 15, position: 100, numGrades: 10},
				{name: 'Quizzes', dropped: 1, weight: 25, position: 200, numGrades: 5},
				{name: 'Labs', dropped: 0, weight: 15, position: 300, numGrades: 8},
				{name: 'Final', dropped: 0, weight: 45, position: 400, numGrades: 1},
			],
		});
	});

	it('deserialization removes invalid categories', function () {
		expect(serializer._deserializeCategory('1|5|10|15|null'), 'name is null (string)').to.equal(null);
		expect(serializer._deserializeCategory('1|5|10|0|'), 'name is empty').to.equal(null);
		expect(serializer._deserializeCategory('1|5|10|0|valid'), 'empty weight is ok').to.not.equal(null);
	});
});
