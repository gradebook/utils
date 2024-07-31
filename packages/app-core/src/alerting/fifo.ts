
export class RingFifo<T> {
	private store: T[];
	private head = 0;
	private tail = 0;
	private full = false;

	constructor(size: number) {
		this.store = Array.from({length: size});
	}

	/**
	 * Adds an item to the queue
	 * @param item - the item to add
	 * @returns if the item was added. If the queue is at capacity, new items are dropped
	 */
	push(item: T): boolean {
		if (this.full) {
			return false;
		}

		this.store[this.tail] = item;
		this.tail = (this.tail + 1) % this.store.length;
		this.full = this.tail === this.head;

		return true;
	}

	/**
	 * @returns The next item in the queue, or `undefined` if the queue is empty.
	 */
	pop(): T | undefined {
		if (this.head === this.tail && !this.full) {
			return undefined;
		}

		this.full = false;
		const item = this.store[this.head];
		this.head = (this.head + 1) % this.store.length;
		return item;
	}

	/**
	 * Empties the queue and returns an iterable of all items in the queue.
	 */
	* popAll(): IterableIterator<T> {
		if (this.head === this.tail && !this.full) {
			return;
		}

		const {store, head, tail} = this;
		this.store = Array.from({length: store.length});
		this.head = 0;
		this.tail = 0;
		this.full = false;

		let notTouched = true;

		for (let i = head; notTouched || i !== tail; i = (i + 1) % store.length) {
			notTouched = false;
			yield store[i];
		}
	}

	/**
	 * Wrapper method around `popAll`. Returns an array of all items in the queue.
	 */
	toArray() {
		return Array.from(this.popAll());
	}
}
