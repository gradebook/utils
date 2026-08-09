// @ts-check
import {inspect} from 'node:util';
import {setTimeout} from 'node:timers/promises';
import {expect} from 'chai';
import sinon from 'sinon';
import {PersistentSocket, __test} from '../../../lib/alerting/persistent-socket.js';
import {TestSocket} from '../../fixtures/test-socket.js';

/**
 * Wrapper around `setTimeout(0)` that requires explaining why it's needed
 * @param {string} _reason
 */
async function nextMicrotask(_reason) {
	await setTimeout(0);
}

/**
 * @param {'pending' | 'rejected' | 'fulfilled'} state
 */
function promiseShouldBe(object, state) {
	const rawActualStatus = inspect(object) ?? '';
	const tokens = rawActualStatus.split('\n');
	const status = tokens[1] ?? '';

	if (status === 'fulfilled') {
		throw new Error('ni');
	} else {
		/**
		 * Pending promises usually look like `Promise { <pending> }`
		 * Rejected promises usually look like `Promise {\n <rejected> Error: ... }`
		 * In a debugger, the promise might have async tags:
		 *  Promise {\n <pending>,\n[Symbol(async_id_symbol)]...}`
		 */
		const matcher = new RegExp(`^Promise {\\s+<${state}>[, ]`);
		expect(rawActualStatus).to.match(matcher);
	}
}

describe('Unit > PersistentSocket', function () {
	/** @type {import('sinon').SinonFakeTimers} */
	let clock;
	/** @type {any} */
	let logger;
	/** @type {PersistentSocket} */
	let socket;

	before(function () {
		__test.setSocketImplementation(TestSocket);
	});

	function socketStatus() {
		// @ts-expect-error
		return socket.socketReady;
	}

	function backoffTime() {
		// @ts-expect-error
		return socket.socketBackoff;
	}

	beforeEach(function () {
		// @ts-expect-error
		TestSocket.instance = null;
		clock = sinon.useFakeTimers();

		logger = {
			info: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
		};

		socket = new PersistentSocket('/test/socket/path', logger);
		expect(TestSocket.instance, 'TestSocket was instantiated').to.be.ok;
		clock.tick(0); // "wait" for the backoff timer
	});

	afterEach(function () {
		clock.restore();
		sinon.restore();
	});

	it('creates a socket on construction', function () {
		expect(TestSocket.instance.connectCallback).to.be.ok;
		promiseShouldBe(socketStatus(), 'pending');
	});

	it('write buffering', async function () {
		const message = '{"sequence": 0, "name": "hello, world", message: "Something went wrong"}\n';

		socket.write(message);
		await nextMicrotask('Socket write handling is async');

		expect(TestSocket.instance.writeHistory).to.deep.equal([]);

		TestSocket.instance.connectCallback();
		await nextMicrotask('Socket write handling is async');

		expect(TestSocket.instance.writeHistory).to.deep.equal([message]);
	});

	describe('waitForAck', function () {
		it('no timeout', async function () {
			const sequence = 1;

			const originalTimerCount = clock.countTimers();
			const ackPromise = socket.waitForAck(sequence, 0);
			expect(clock.countTimers()).to.equal(originalTimerCount);

			TestSocket.instance.dataCallback(JSON.stringify({type: 'ack', sequence}) + '\n');

			await ackPromise;
		});

		it('response before timeout', async function () {
			const sequence = 1;
			const timeout = 1000;

			const ackPromise = socket.waitForAck(sequence, timeout);

			clock.tick(timeout - 1);
			TestSocket.instance.dataCallback(JSON.stringify({type: 'ack', sequence}) + '\n');

			await ackPromise;
		});

		it('response after timeout', async function () {
			const sequence = 1;
			const timeout = 1000;

			const ackPromise = socket.waitForAck(sequence, timeout);

			clock.tick(timeout + 1);
			TestSocket.instance.dataCallback(JSON.stringify({type: 'ack', sequence}) + '\n');

			const [ackResult] = await Promise.allSettled([ackPromise]);

			expect(ackResult.status).to.equal('rejected');
			// @ts-expect-error
			expect(ackResult.reason?.message).to.equal('Timeout waiting for ack');
		});

		it('no response and timeout', async function () {
			const timeout = 1000;
			const ackPromise = socket.waitForAck(1, timeout);
			clock.tick(timeout + 1);

			const [ackResult] = await Promise.allSettled([ackPromise]);

			expect(ackResult.status).to.equal('rejected');
			// @ts-expect-error
			expect(ackResult.reason?.message).to.equal('Timeout waiting for ack');
		});

		it('invalid sequence', async function () {
			TestSocket.instance.dataCallback('{"type": "ack", "sequence": 1}');
			await nextMicrotask('Socket read handling is async');

			expect(logger.warn.called, 'No newline').to.be.false;

			TestSocket.instance.dataCallback('\n');
			await setTimeout(0);

			expect(logger.warn.calledOnce).to.be.true;
			expect(logger.warn.args[0][0]).to.contain('ack for unknown seq');
		});

		it('socket closed', async function () {
			TestSocket.instance.connectCallback();

			const promise = socket.waitForAck(1, 1000);

			TestSocket.instance.errorCallback(new Error('socket closed'));

			const [ackResult] = await Promise.allSettled([promise]);
			expect(ackResult.status).to.equal('rejected');
		});
	});

	it('batches buffered messages', async function () {
		TestSocket.instance.customHighWaterMark = 20;

		socket.write('message1');
		socket.write('message2');
		socket.write('message3');

		TestSocket.instance.connectCallback();
		await nextMicrotask('Socket write handling is async');
		expect(TestSocket.instance.writeHistory).to.deep.equal(['message1message2', 'message3']);
	});

	it('writes wait for flush', async function () {
		TestSocket.instance.writeWasSuccessful = false;
		TestSocket.instance.connectCallback();

		socket.write('message1');
		expect(TestSocket.instance.drainCallback).to.not.be.ok;
		await nextMicrotask('Socket write handling is async');

		expect(TestSocket.instance.drainCallback).to.be.ok;
		TestSocket.instance.drainCallback();
	});

	it('retries a failed message', async function () {
		TestSocket.instance.connectCallback();

		socket.write('message1');
		await nextMicrotask('await socketReady in drain delays by 1 tick');

		TestSocket.instance.errorCallback(new Error('socket disconnected'));

		clock.tick(backoffTime());
		TestSocket.instance.connectCallback();

		await nextMicrotask('Socket write handling is async');
		expect(TestSocket.instance.writeHistory).to.deep.equal(['message1']);
	});

	it('write queue is full', async function () {
		socket = new PersistentSocket('/test/socket/path', logger, 1);
		clock.tick(0);

		TestSocket.instance.connectCallback();

		expect(socket.write('message1')).to.be.true;
		expect(socket.write('message2')).to.be.false;

		await nextMicrotask('Socket write handling is async');
		expect(TestSocket.instance.writeHistory).to.deep.equal(['message1']);
	});

	describe('error handling', function () {
		it('before creation', async function () {
			const originalAlertingSocket = TestSocket.instance;
			const originalSocketStatus = socketStatus();

			TestSocket.instance.errorCallback(new Error('Socket error'));

			expect(originalAlertingSocket).to.not.equal(TestSocket.instance);
			expect(originalSocketStatus).to.not.equal(socketStatus());
			promiseShouldBe(originalSocketStatus, 'rejected');
			promiseShouldBe(socketStatus(), 'pending');
		});

		it('after creation', async function () {
			const originalAlertingSocket = TestSocket.instance;
			TestSocket.instance.connectCallback();

			socket.write('hello');

			TestSocket.instance.errorCallback(new Error('Socket error'));
			await nextMicrotask('Socket recreation is async');

			expect(TestSocket.instance).to.not.equal(originalAlertingSocket);
			expect(TestSocket.instance.connectCallback, 'backoff').to.not.be.ok;

			clock.tick(backoffTime());
			expect(TestSocket.instance.connectCallback).to.be.ok;

			expect(TestSocket.instance.writeHistory).to.deep.equal(['hello']);
		});

		it('weird incoming data', async function () {
			TestSocket.instance.connectCallback();

			const message = '{"sequence": 0, "type": "typo"}\n{"type":3}\n{}\nThis is not json\n';

			TestSocket.instance.dataCallback(message);
			await nextMicrotask('Socket write handling is async');

			expect(logger.warn.callCount).to.equal(6);
			expect(logger.warn.args[0][0]).to.contain('Failed parsing message');
			expect(logger.warn.args[1][0].message).to.contain('Invalid message');
			expect(logger.warn.args[2][0]).to.contain('Failed parsing message');
			expect(logger.warn.args[3][0].message).to.contain('Invalid message');
			expect(logger.warn.args[4][0]).to.contain('Failed parsing message');
			expect(logger.warn.args[5][0].message).to.contain('is not valid JSON');
			expect(logger.error.calledOnce).to.be.true;
			expect(logger.error.args[0][0]).to.contain('Unknown message from alerting socket');
		});

		it('writing with unstable socket', async function () {
			socket.write('Hello, world!');

			TestSocket.instance.errorCallback(new Error('Socket error'));
			await nextMicrotask('Socket error handling is async');

			expect(TestSocket.instance.writeHistory).to.deep.equal([]);
			// @ts-expect-error
			expect(socket.messageQueue.store[0], 'Message should still be queued')
				.to.equal('Hello, world!');
		});

		it('socket error, full message queue', async function () {
			socket = new PersistentSocket('/test/socket/path', logger, 1);
			clock.tick(0);

			TestSocket.instance.connectCallback();

			socket.write('message1');
			await nextMicrotask('await socketReady in drain delays by 1 tick');
			socket.write('blockingMessage');

			TestSocket.instance.errorCallback(new Error('socket disconnected'));

			clock.tick(backoffTime());
			TestSocket.instance.connectCallback();

			await nextMicrotask('Socket write handling is async');
			expect(TestSocket.instance.writeHistory).to.deep.equal(['blockingMessage']);
			expect(logger.warn.args[0][0]).to.contain('message1');
		});
	});
});
