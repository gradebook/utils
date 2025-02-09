// @ts-check
import {Socket} from 'node:net';

export class TestSocket extends Socket {
	/** @type {TestSocket} */
	static instance;

	constructor() {
		super();

		TestSocket.instance = this;
		this.connectCallback = null;
		this.drainCallback = null;
		this.errorCallback = null;
		this.dataCallback = null;
		this.writeHistory = [];
		this.writeWasSuccessful = true;
		this.customHighWaterMark = 0;
	}

	// @ts-expect-error
	get writableHighWaterMark() {
		if (this.customHighWaterMark > 0) {
			return this.customHighWaterMark;
		}

		return super.writableHighWaterMark;
	}

	connect(path, callback) {
		this.connectCallback = callback;
		return this;
	}

	once(event, callback) {
		const callbackKey = `${event}Callback`;
		if (this[callbackKey]) {
			throw new Error('Not supported');
		}

		this[callbackKey] = (...args) => {
			callback(...args);
			this[callbackKey] = null;
		};

		return this;
	}

	on(event, callback) {
		const callbackKey = `${event}Callback`;
		if (this[callbackKey] === null) {
			this[callbackKey] = callback;
			return this;
		}

		// Called by the parent class
		if (event === 'end') {
			return this;
		}

		throw new Error(`on:${event} not implemented`);
	}

	write(message) {
		this.writeHistory.push(message);
		return this.writeWasSuccessful;
	}
}
