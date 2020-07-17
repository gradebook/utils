// This file specifically tests deserialization across older versions

const {expect} = require('chai');
const serializer = require('../lib/commonjs/course-serializer');

const SERIALIZED_V0_COURSE = 'eyJtIjoiMHwyMDIwfDB8OTB8ODB8NzB8NjB8QXxCfEN8RHxFeGFtcGxlIENvdXJzZSIsInoiOlsiMXwwfDIwfDB8QXR0ZW5kYW5jZSIsIjF8MHwxM3wxfE9ubGluZSBRdWl6emVzIiwiMXwwfDR8NXxDdWx0dXJhbCBEaXNjb3Vyc2UgSm91cm5hbCIsIjB8MHwxfDIwfEV4YW0gMSIsIjB8MHwxfDIwfEV4YW0gMiIsIjB8MHwxfDV8SW5pdGlhbCBFc3NheSIsIjB8MHwxfDE1fEZpbmFsIEVzc2F5IiwiMXwwfDJ8MTB8U2hvcnQgUGFwZXIiLCIwfDB8MXw1fFBhcnRpY2lwYXRpb24iLCIwfDB8MXw1fFByZXNlbnRhdGlvbiIsIjB8MHwxfDE1fE9ubGluZSBRdWl6emVzIGFmdGVyIGRyb3BwZWQiXX0=';

describe('Regression > Course Serializer', function () {
	it('v0', function () {
		// We need to allow the version to come back as 0 since this is a regression test for that version
		// Must create new object to make sure we don't affect other tests
		const exampleCourse = require('../fixtures/example-serialized-course.json');
		const exampleAsV0 = {...exampleCourse, version: 0};

		expect(serializer.deserialize(SERIALIZED_V0_COURSE)).to.deep.equal(exampleAsV0);
	});
});
