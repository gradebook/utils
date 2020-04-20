// @ts-check
const {expect} = require('chai');
const serializer = require('../lib/course-serializer');

const getSafeCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-serialized-course')));
const getExampleCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-course')));

const SERIALIZED_COURSE = 'eyJtIjoiMHwyMDIwfDB8OTB8ODB8NzB8NjB8QXxCfEN8RHxFeGFtcGxlIENvdXJzZSIsInoiOlsiMHwwfDIwfDB8QXR0ZW5kYW5jZSIsIjB8MHwxM3wxfE9ubGluZSBRdWl6emVzIiwiMHwwfDR8NXxDdWx0dXJhbCBEaXNjb3Vyc2UgSm91cm5hbCIsIjF8MHwxfDIwfEV4YW0gMSIsIjF8MHwxfDIwfEV4YW0gMiIsIjF8MHwxfDV8SW5pdGlhbCBFc3NheSIsIjF8MHwxfDE1fEZpbmFsIEVzc2F5IiwiMHwwfDJ8MTB8U2hvcnQgUGFwZXIiLCIxfDB8MXw1fFBhcnRpY2lwYXRpb24iLCIxfDB8MXw1fFByZXNlbnRhdGlvbiIsIjF8MHwxfDE1fE9ubGluZSBRdWl6emVzIGFmdGVyIGRyb3BwZWQiXX0=';

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
