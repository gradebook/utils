// @ts-check
/* eslint-disable unicorn/no-array-push-push */
import {expect} from 'chai';
import {RingFifo} from '../../../lib/alerting/fifo.js';

describe('RingFifo', function () {
	/** @type {RingFifo} */
	let buffer;

	beforeEach(function () {
		buffer = new RingFifo(3);
	});

	it('empty', function () {
		expect(buffer.toArray()).to.deep.equal([]);
		expect(buffer.pop()).to.equal(undefined);

		for (const element of buffer.popAll()) {
			expect(false, 'should not have looped').to.equal(true);
			expect(element).to.equal(true);
		}
	});

	it('size', function () {
		expect(buffer.size).to.equal(0);
		buffer.push(1);
		buffer.push(3);
		buffer.push(2);
		buffer.pop();

		expect(buffer.size).to.equal(2);
		buffer.pop();
		expect(buffer.size).to.equal(1);
	});

	it('add', function () {
		expect(buffer.push(1)).to.equal(true);
		expect(buffer.push(2)).to.equal(true);

		let callCount = 0;
		for (const element of buffer.popAll()) {
			callCount++;
			expect(element).to.equal(callCount);
		}

		expect(callCount, 'queue should have 2 elements').to.equal(2);
	});

	it('drops new elements when full', function () {
		expect(buffer.push(1)).to.equal(true);
		expect(buffer.push(2)).to.equal(true);
		expect(buffer.push(3)).to.equal(true);
		expect(buffer.push(4)).to.equal(false);
		expect(buffer.push(5)).to.equal(false);

		expect(buffer.toArray()).to.deep.equal([1, 2, 3]);
	});

	it('first in, first out', function () {
		buffer.push(1);
		buffer.push(2);

		expect(buffer.pop()).to.equal(1);
		expect(buffer.pop()).to.equal(2);
		expect(buffer.pop(), 'Empty queue should return nothing').to.equal(undefined);
	});
});
