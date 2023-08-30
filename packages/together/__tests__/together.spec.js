// @ts-check
import process from 'node:process';
import {expect} from 'chai';
import sinon from 'sinon';
import * as together from '../lib/together.js';

/** @type {sinon.SinonStub} */
let execStub;

class Together extends together.Together {
	// @ts-expect-error
	get _exec() {
		return execStub;
	}

	set _exec(next) {}
}

describe('together', function () {
	/** @type {sinon.SinonStub} */
	let logStub;

	beforeEach(function () {
		execStub = sinon.stub();
		logStub = sinon.stub(console, 'log');
	});

	afterEach(function () {
		sinon.restore();
	});

	it('registers exit hooks once', function () {
		const stub = sinon.stub(process, 'on');
		let instance = new Together([['name', 'path']]);

		expect(stub.calledTwice).to.be.true;
		stub.reset();

		// eslint-disable-next-line no-unused-vars
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
			['update-check', '/path/to/upgrade'],
		]);

		expect(logStub.calledThrice).to.be.true;
		expect(execStub.calledThrice).to.be.true;
		// @ts-ignore
		expect(instance._children).to.be.an('array').with.lengthOf(3);
	});

	it('supports passing arguments to execa', function () {
		// eslint-disable-next-line no-unused-vars
		const instance = new Together([
			['build', '/path/to/build', {env: {NODE_ENV: 'production'}}],
		]);

		expect(logStub.calledOnce).to.be.true;
		expect(execStub.calledOnce).to.be.true;
		expect(execStub.args[0][1]).to.deep.equal({stdio: 'inherit', env: {NODE_ENV: 'production'}});
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
