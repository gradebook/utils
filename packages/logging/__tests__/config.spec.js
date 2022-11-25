// @ts-check
import {cwd} from 'process';
import {expect} from 'chai';
import {createSafeOptions} from '../lib/config.js';

const DEFAULT_ROTATION = {
	count: 10,
	gzip: false,
	period: '1w',
	threshold: '',
	rotateExisting: true,
};

describe('Unit > Config Parser', function () {
	it('sane defaults', function () {
		expect(createSafeOptions({})).to.deep.equal({
			domain: 'localhost',
			env: 'development',
			level: 'info',
			name: 'Log',
			path: cwd(),
			rotation: DEFAULT_ROTATION,
			transports: ['stdout'],
		});
	});

	it('rotation coercion', function () {
		expect(createSafeOptions({rotation: false})).to.deep.contain({rotation: null});
		expect(createSafeOptions({rotation: true})).to.deep.contain({rotation: DEFAULT_ROTATION});
		expect(createSafeOptions({rotation: {gzip: true, threshold: '50m'}})).to.deep.contain({
			rotation: {
				...DEFAULT_ROTATION,
				gzip: true,
				period: '',
				threshold: '50m',
			},
		});

		try {
			createSafeOptions({rotation: {gzip: true}});
			expect(false).to.equal(true);
		} catch (error) {
			if (!(error instanceof Error)) {
				throw error;
			}

			expect(error.message).to.contain('`period` must be provided');
		}
	});
});
