// @ts-check
const {ServerResponse} = require('http');

module.exports = class FakeResponse extends ServerResponse {
	constructor(...args) {
		// @ts-expect-error proxies are the best
		super(...args);
		this.data = null;
		this.used = false;
	}

	/**
	 * @param {number} code
	 */
	status(code) {
		this.statusCode = code;
		this.used = true;
		return this;
	}

	/**
	 * @param {object} message
	 */
	json(message) {
		this.data = JSON.stringify(message);
		this.used = true;
	}

	__reset() {
		this.data = null;
		this.used = false;
		this.statusCode = 200;
	}
};
