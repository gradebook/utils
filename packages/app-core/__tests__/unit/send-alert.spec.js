// @ts-check
import {expect} from 'chai';
import sinon from 'sinon';
import {sendAlert, __test} from '../../lib/send-alert.js';
import {PersistentSocket, __test as persistentTest} from '../../lib/alerting/persistent-socket.js';
import {TestSocket} from '../fixtures/test-socket.js';

/**
 * @type {Array<{name: string, parameters: Parameters<typeof sendAlert>, output: Record<string, any>}>}
 */
const TEST_CASES = [
	{
		name: 'only message',
		parameters: ['Test message'],
		output: {
			sequence: '0',
			name: 'test',
			message: 'Test message',
		},
	},
	{
		name: 'message and channel',
		parameters: ['Test message', 'bot-reports'],
		output: {
			sequence: '1',
			name: 'test',
			message: 'Test message',
			channel: 'bot-reports',
		},
	},
	{
		name: 'message with quotes',
		parameters: ['Error: "value" is not valid'],
		output: {
			sequence: '2',
			name: 'test',
			message: 'Error: "value" is not valid',
		},
	},
	{
		name: 'channel with quotes',
		parameters: ['Message', 'bot-"reports"'],
		output: {
			sequence: '3',
			name: 'test',
			message: 'Message',
			channel: 'bot-"reports"',
		},
	},
	{
		name: 'wait',
		parameters: ['Message', undefined, 0],
		output: {
			sequence: '4',
			name: 'test',
			message: 'Message',
			ack: true,
		},
	},
];

describe('Unit > send-alert', function () {
	/** @type {import('sinon').SinonFakeTimers} */
	let clock;
	/** @type {any} */
	let logger;
	/** @type {PersistentSocket} */
	let socket;

	before(function () {
		persistentTest.setSocketImplementation(TestSocket);
	});

	beforeEach(function () {
		clock = sinon.useFakeTimers();
		logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
		};

		socket = new PersistentSocket('/path/to/socket', logger);
		__test.setSocket(socket);
		expect(TestSocket.instance).to.be.instanceOf(TestSocket);
		clock.tick(0); // "wait" for the backoff timer
		TestSocket.instance.connectCallback();
	});

	afterEach(function () {
		clock.restore();
		sinon.restore();
	});

	it('Invalid message', async function () {
		try {
			await sendAlert('');
			expect(false, 'should have thrown').to.be.true;
		} catch (error) {
			expect(error.message).to.equal('Message is required');
		}
	});

	for (const {name, parameters, output} of TEST_CASES) {
		it(name, async function () {
			const promise = sendAlert(...parameters);

			// @ts-expect-error
			const watchers = socket._ackWatchers;
			for (const watcher of watchers.values()) {
				watcher();
			}

			await promise;
			expect(TestSocket.instance.writeHistory).to.deep.equal([JSON.stringify(output) + '\n']);
		});
	}
});
