// @ts-check
const {expect} = require('chai');
const nock = require('nock');

const {exporter} = require('../lib/api.js');

describe('Unit > Exporter', function () {
	it('getExport wraps request to server endpoint', async function () {
		try {
			nock('https://gradebook.app')
				.get('/api/v0/internal/user-dump?user=easy&school=easy')
				.reply(200, url => ({
					user: new URL(url, 'https://gradebook.app').searchParams.get('user'),
				}));

			nock('http://192.168.1.200')
				.get('/api/v0/internal/user-dump?user=lazy&school=lazy')
				.reply(200, url => ({
					user: new URL(url, 'http://192.168.1.200').searchParams.get('user'),
				}));

			const [lazyTest, easyTest] = await Promise.all([
				exporter.getExport({school: 'lazy', userId: 'lazy', hostname: '192.168.1.200'}),
				exporter.getExport({school: 'easy', userId: 'easy', secure: true}),
			]);

			expect(lazyTest).to.deep.equal({user: 'lazy'});
			expect(easyTest).to.deep.equal({user: 'easy'});
		} finally {
			nock.cleanAll();
		}
	});
});
