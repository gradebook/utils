// @ts-check
const {expect} = require('chai');
const serializer = require('../lib/course-serializer');

const getSafeCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-serialized-course')));
const getExampleCourse = () => JSON.parse(JSON.stringify(require('../fixtures/example-course')));

const SERIALIZED_COURSE = 'eyJtIjoiMHwyMDIwfDB8OTB8ODB8NzB8NjB8RXhhbXBsZSBDb3Vyc2UiLCJ6IjpbIjB8MHwyMHwwfEF0dGVuZGFuY2UiLCIwfDB8MTN8MXxPbmxpbmUgUXVpenplcyIsIjB8MHw0fDV8Q3VsdHVyYWwgRGlzY291cnNlIEpvdXJuYWwiLCIxfDB8MXwyMHxFeGFtIDEiLCIxfDB8MXwyMHxFeGFtIDIiLCIxfDB8MXw1fEluaXRpYWwgRXNzYXkiLCIxfDB8MXwxNXxGaW5hbCBFc3NheSIsIjB8MHwyfDEwfFNob3J0IFBhcGVyIiwiMXwwfDF8NXxQYXJ0aWNpcGF0aW9uIiwiMXwwfDF8NXxQcmVzZW50YXRpb24iLCIxfDB8MXwxNXxPbmxpbmUgUXVpenplcyBhZnRlciBkcm9wcGVkIl19';

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
