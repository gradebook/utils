
export class RingFifo<T> {
	protected store: T[];
	protected head = 0;
	protected tail = 0;
	protected full = false;

	constructor(capacity: number) {
		this.store = Array.from({length: capacity});
	}

	get count() {
		const {length} = this.store;
		return this.full ? length : (this.tail - this.head + length) % length;
	}

	/**
	 * Adds an item to the queue
	 * @param item - the item to add
	 * @returns if the item was added. If the queue is at capacity, new items are dropped
	 */
	add(item: T): boolean {
		if (this.full) {
			return false;
		}

		this.store[this.tail] = item;
		this.tail = (this.tail + 1) % this.store.length;
		this.full = this.tail === this.head;

		return true;
	}

	/**
	 * Adds an item to the beginning
	 * @param item - the item to add
	 * @returns if the item was added. If the queue is at capacity, new items are dropped
	 */
	prioritize(item: T): boolean {
		if (this.full) {
			return false;
		}

		this.head = (this.head - 1 + this.store.length) % this.store.length;
		this.store[this.head] = item;
		this.full = this.tail === this.head;
		return true;
	}

	/**
	 * @returns The next item in the queue, or `undefined` if the queue is empty.
	 */
	next(): T | undefined {
		if (this.head === this.tail && !this.full) {
			return undefined;
		}

		this.full = false;
		const item = this.store[this.head];
		this.head = (this.head + 1) % this.store.length;
		return item;
	}
}
