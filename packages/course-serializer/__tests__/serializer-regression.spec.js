// This file specifically tests deserialization across older versions

import {readFileSync} from 'fs';
import {expect} from 'chai';
import * as serializer from '../lib/course-serializer.js';

const SERIALIZED_V0_COURSE = 'eyJtIjoiMHwyMDIwfDB8OTB8ODB8NzB8NjB8QXxCfEN8RHxFeGFtcGxlIENvdXJzZSIsInoiOlsiMXwwfDIwfDB8QXR0ZW5kYW5jZSIsIjF8MHwxM3wxfE9ubGluZSBRdWl6emVzIiwiMXwwfDR8NXxDdWx0dXJhbCBEaXNjb3Vyc2UgSm91cm5hbCIsIjB8MHwxfDIwfEV4YW0gMSIsIjB8MHwxfDIwfEV4YW0gMiIsIjB8MHwxfDV8SW5pdGlhbCBFc3NheSIsIjB8MHwxfDE1fEZpbmFsIEVzc2F5IiwiMXwwfDJ8MTB8U2hvcnQgUGFwZXIiLCIwfDB8MXw1fFBhcnRpY2lwYXRpb24iLCIwfDB8MXw1fFByZXNlbnRhdGlvbiIsIjB8MHwxfDE1fE9ubGluZSBRdWl6emVzIGFmdGVyIGRyb3BwZWQiXX0=';

const SERIALIZED_IN_BROWSER_V1_COURSE = 'ewAiAG0AIgA6ACIAMQB8ADIAMAAyADEAfAA0AHwANAB8AEEALAA0ADkANQB8AEIALAA0ADQAMAB8AEMALAAzADgANQB8AEQALAAzADMAMAB8AEUAQwBFAE4AIAA0ADAANAAiACwAIgB6ACIAOgBbACIAMQB8ADAAfAA0AHwAMgAwADAAfABCAGkALQBXAGUAZQBrAGwAeQAgAFUAcABkAGEAdABlAHMAIgAsACIAMAB8ADAAfAAxAHwAMgAwAHwARQB0AGgAaQBjAHMAIABRAHUAaQB6AHoAZQBzACIALAAiADAAfAAwAHwAMQB8ADgAMAB8AFAAbwBzAHQAZQByACwAIABQAHIAZQBzAGUAbgB0AGEAdABpAG8AbgAsACAAVgBpAGQAZQBvACIALAAiADAAfAAwAHwAMQB8ADIANQAwAHwARgBpAG4AYQBsACAAUgBlAHAAbwByAHQAIgBdAH0A';

/* @todo - do this when our XO version supports top level await const [
	EXAMPLE_V0_COURSE,
	EXAMPLE_V1_COURSE,
] = await Promise.all([
	readFile(new URL('../fixtures/v0-example-serialized-course.json', import.meta.url), 'utf-8'),
	readFile(new URL('../fixtures/v1-browser-example-serialized-course.json', import.meta.url), 'utf-8'),
]); */

const EXAMPLE_V0_COURSE = readFileSync(new URL('../fixtures/v0-example-serialized-course.json', import.meta.url), 'utf-8');
const EXAMPLE_V1_COURSE = readFileSync(new URL('../fixtures/v1-browser-example-serialized-course.json', import.meta.url), 'utf-8');

describe('Regression > Course Serializer', function () {
	it('v0', function () {
		const course = JSON.parse(EXAMPLE_V0_COURSE);
		expect(serializer.deserialize(SERIALIZED_V0_COURSE)).to.deep.equal(course);
	});

	it('v1 (from browser)', function () {
		const course = JSON.parse(EXAMPLE_V1_COURSE);
		expect(serializer.deserialize(SERIALIZED_IN_BROWSER_V1_COURSE)).to.deep.equal(course);
	});
});
