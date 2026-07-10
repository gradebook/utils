// @ts-check
import {expect} from 'chai';
import {RingFifo} from '../../../lib/alerting/fifo.js';

class RingFifoTest extends RingFifo {
	toArray() {
		if (this.head === this.tail && !this.full) {
			return [];
		}

		const {store, head, tail} = this;
		const response = [];
		let notTouched = true;

		for (let i = head; notTouched || i !== tail; i = (i + 1) % store.length) {
			notTouched = false;
			response.push(store[i]);
		}

		return response;
	}
}

/**
 * @param {RingFifoTest} queue
 * @param {number[]} expected
 */
function expectQueueItems(queue, expected) {
	expect(queue.toArray()).to.deep.equal(expected);
	expect(queue.count).to.equal(expected.length);
}

describe('RingFifo', function () {
	/** @type {RingFifoTest} */
	let queue;

	beforeEach(function () {
		queue = new RingFifoTest(3);
	});

	it('empty', function () {
		expect(queue.count).to.equal(0);
		expectQueueItems(queue, []);
		expect(queue.next()).to.equal(undefined);
	});

	it('count', function () {
		expect(queue.count).to.equal(0);
		queue.add(1);
		queue.add(3);
		queue.add(2);
		queue.next();

		expect(queue.count).to.equal(2);
		queue.next();
		expect(queue.count).to.equal(1);
	});

	it('add', function () {
		expect(queue.add(1)).to.equal(true);
		expect(queue.add(2)).to.equal(true);

		expectQueueItems(queue, [1, 2]);

		expect(queue.prioritize(3)).to.equal(true);
		expectQueueItems(queue, [3, 1, 2]);

		expect(queue.prioritize(4)).to.equal(false);
	});

	it('drops new elements when full', function () {
		expect(queue.add(1)).to.equal(true);
		expect(queue.add(2)).to.equal(true);
		expect(queue.add(3)).to.equal(true);
		expect(queue.add(4)).to.equal(false);
		expect(queue.add(5)).to.equal(false);

		expectQueueItems(queue, [1, 2, 3]);
	});

	it('first in, first out', function () {
		queue.add(1);
		queue.add(2);

		expect(queue.next()).to.equal(1);
		expect(queue.next()).to.equal(2);
		expect(queue.next(), 'Empty queue should return nothing').to.equal(undefined);
	});
});
