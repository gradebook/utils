// @ts-check
const {expect} = require('chai');
const serializer = require('../lib/course-serializer');

const getSafeCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-serialized-course.json')));
const getExampleCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-course.json')));

const SERIALIZED_COURSE = 'eyJtIjoiMHwyMDIwfDB8OTB8ODB8NzB8NjB8QXxCfEN8RHxFeGFtcGxlIENvdXJzZSIsInoiOlsiMXwwfDIwfDB8QXR0ZW5kYW5jZSIsIjF8MHwxM3wxfE9ubGluZSBRdWl6emVzIiwiMXwwfDR8NXxDdWx0dXJhbCBEaXNjb3Vyc2UgSm91cm5hbCIsIjB8MHwxfDIwfEV4YW0gMSIsIjB8MHwxfDIwfEV4YW0gMiIsIjB8MHwxfDV8SW5pdGlhbCBFc3NheSIsIjB8MHwxfDE1fEZpbmFsIEVzc2F5IiwiMXwwfDJ8MTB8U2hvcnQgUGFwZXIiLCIwfDB8MXw1fFBhcnRpY2lwYXRpb24iLCIwfDB8MXw1fFByZXNlbnRhdGlvbiIsIjB8MHwxfDE1fE9ubGluZSBRdWl6emVzIGFmdGVyIGRyb3BwZWQiXX0=';

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
});
