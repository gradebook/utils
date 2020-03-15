// @ts-check
const {expect} = require('chai');
const execa = require('execa');
const sinon = require('sinon');
const together = require('..');

const Together = together.default;

describe('together', () => {
	/** @type {sinon.SinonStub} */
	let execStub;
	/** @type {sinon.SinonStub} */
	let logStub;

	beforeEach(function () {
		execStub = sinon.stub(execa, 'command');
		logStub = sinon.stub(console, 'log');
	});

	afterEach(function () {
		sinon.restore();
	});

	it('registers exit hooks once', function () {
		const stub = sinon.stub(process, 'on');
		// eslint-disable-next-line no-unused-vars
		let instance = new Together([['name', 'path']]);

		expect(stub.calledTwice).to.be.true;
		stub.reset();

		instance = new Together([['name2', 'path2']]);

		expect(stub.called).to.be.false;
	});

	it('cleanup calls shutdown on all known instances', function () {
		// The previous test registered 2 instances. I know this isn't a best practice but it's all I can think of for now
		const stub = sinon.stub(Together.prototype, 'shutdown');
		together.cleanup();
		expect(stub.calledTwice).to.be.true;
	});

	it('launches each command with information', function () {
		const instance = new Together([
			['build', '/path/to/build'],
			['test', '/path/to/test'],
			['update-check', '/path/to/upgrade']
		]);

		expect(logStub.calledThrice).to.be.true;
		expect(execStub.calledThrice).to.be.true;
		// @ts-ignore
		expect(instance._children).to.be.an('array').with.lengthOf(3);
	});

	it('shutsdown with context', function () {
		const instance = new Together([['child', 'process'], ['baby', 'boy']]);
		const shutdownStub = sinon.stub();
		const child = {cancel: shutdownStub};

		// @ts-ignore
		expect(instance._children).to.be.an('array').with.length(2);
		// @ts-ignore
		instance._children = [{child}, {child}];
		// @ts-ignore
		expect(instance._terminated).to.be.false;

		instance.shutdown();

		// @ts-ignore
		expect(instance._terminated).to.be.true;
		expect(shutdownStub.calledTwice).to.be.true;
		shutdownStub.reset();

		instance.shutdown();

		expect(shutdownStub.called).to.be.false;
	});
});
