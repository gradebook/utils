// @ts-check
const {IncomingMessage} = require('http');
const {promisify} = require('util');
const {expect} = require('chai');
const sinon = require('sinon');
const _module = require('../lib/passport-utils.js');

/** @returns {import ('../lib/_passport-types').PassportOauth20Profile} */
// @ts-ignore
const makeFakeProfile = () => ({
	id: 'this is a gid',
	emails: [{value: 'test@gbdev.cf'}],
	displayName: 'Aggie',
	name: {
		givenName: 'Texas A&M',
		familyName: 'University',
	},
});

/** @returns {_module.BasicRequest} */
// @ts-expect-error
const makeFakeMessage = (session = {}) => Object.assign(new IncomingMessage(null), session);
describe('Unit > Passport Utils', function () {
	describe('createProfileHandler', function () {
		let userFunction;
		let instance;

		beforeEach(function () {
			userFunction = sinon.stub().resolves();
			instance = promisify(_module.createProfileHandler(userFunction));
		});

		it('returns the user provided by getUser()', async function () {
			const fakeUser = {};
			userFunction.withArgs('id', 'school').resolves(fakeUser);

			const response = await instance({_table: 'school'}, null, null, {id: 'id'});

			expect(response).to.equal(fakeUser);
		});

		it('gracefully fails when getUser() fails', async function () {
			const expectedError = new Error('oops');
			userFunction.withArgs('id', 'school').rejects(expectedError);

			try {
				await instance({_table: 'school'}, null, null, {id: 'id'});
				throw new Error('Expect instance to throw');
			} catch (error) {
				expect(error).to.equal(expectedError);
			}
		});
	});

	describe('_parseNameFromGoogle', function () {
		it('stores the proper first and last name: all fields are provided', async function () {
			const profile = makeFakeProfile();
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('Texas A&M');
			expect(lastName).to.equal('University');
		});

		it('stores the proper first and last name: no last name provided', async function () {
			const profile = makeFakeProfile();
			profile.name.familyName = '';
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('Texas A&M');
			expect(lastName).to.equal('');
		});

		it('stores the proper first and last name: no first name provided', async function () {
			const profile = makeFakeProfile();
			profile.name.givenName = '';
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('Aggie');
			expect(lastName).to.equal('University');
		});

		it('stores the proper first and last name: only first name provided', async function () {
			const profile = makeFakeProfile();
			profile.displayName = '';
			profile.name.familyName = '';
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('Texas A&M');
			expect(lastName).to.equal('');
		});

		it('stores the proper first and last name: only last name provided', async function () {
			const profile = makeFakeProfile();
			profile.displayName = '';
			profile.name.givenName = '';
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('University');
			expect(lastName).to.equal('');
		});

		it('stores the proper first and last name: no fields are provided', async function () {
			const profile = makeFakeProfile();
			profile.displayName = '';
			profile.name.familyName = '';
			profile.name.givenName = '';
			const {firstName, lastName} = _module._parseNameFromGoogle(profile);

			expect(firstName).to.equal('Student');
			expect(lastName).to.equal('');
		});
	});

	describe('createUserDeserializer', function () {
		let deserialize;
		let getUser;

		beforeEach(function () {
			getUser = sinon.stub();
			deserialize = promisify(_module.createUserDeserializer(getUser, false));
		});

		it('cleans up domain', async function () {
			deserialize = promisify(_module.createUserDeserializer(getUser, '.gbdev.cf'));
			const request = makeFakeMessage({_table: 'notAschool', session: {}});

			await deserialize(request, 'school:id');

			expect(request._passportRedirect).to.equal('//school.gbdev.cf/my/');
		});

		it('gracefully handles getUser() failing', async function () {
			const expectedError = new Error('oops');
			getUser.withArgs('id', 'school').rejects(expectedError);

			try {
				await deserialize(makeFakeMessage({_table: 'school', session: {}}), 'school:id');
			} catch (error) {
				expect(error).to.equal(expectedError);
				expect(getUser.calledWithExactly('id', 'school')).to.be.true;
			}
		});

		it('successfully fails when the user does not exist', async function () {
			getUser.withArgs('id', 'school').resolves(null);

			const user = await deserialize(makeFakeMessage({_table: 'school', session: {}}), 'school:id');

			expect(user).to.equal(null);
		});

		it('returns the user under normal circumstances', async function () {
			const expectedUser = {};
			getUser.withArgs('id', 'school').resolves(expectedUser);

			const user = await deserialize(makeFakeMessage({_table: 'school', session: {}}), 'school:id');

			expect(user).to.equal(expectedUser);
		});

		it('can find the user when host matching is disabled', async function () {
			const expectedUser = {};
			getUser.withArgs('id', null).resolves(expectedUser);

			const user = await deserialize(makeFakeMessage({_table: null, session: {}}), 'null:id');

			expect(user).to.equal(expectedUser);
			expect(getUser.calledWithExactly('id', null)).to.be.true;
		});

		it('redirects the user when they are on the incorrect domain', async function () {
			deserialize = promisify(_module.createUserDeserializer(getUser, 'gbdev.cf'));

			const request = makeFakeMessage({_table: 'differentSchool', session: {}});

			const user = await deserialize(request, 'school:id');

			expect(user).to.be.an('object').and.not.keys;
			expect(getUser.called).to.be.false;
			expect(request._passportRedirect).to.be.a('string').and.equal('//school.gbdev.cf/my/');
		});

		it('finds unapproved profiles', async function () {
			const userProfile = makeFakeProfile();

			const user = await deserialize(makeFakeMessage({session: {userProfile}}), '__school__:1234');

			expect(user).to.equal(userProfile);
			expect(getUser.called).to.be.false;
		});

		it('finds newly approved users (without host matching)', async function () {
			const expectedUser = {};
			getUser.withArgs('1234', null).resolves(expectedUser);

			const user = await deserialize(makeFakeMessage({session: {school: 'null'}}), '__school__:1234');

			expect(user).to.equal(expectedUser);
			expect(getUser.calledWithExactly('1234', null)).to.be.true;
		});

		it('finds newly approved users (with host matching)', async function () {
			const expectedUser = {};
			getUser.withArgs('1234', 'school').resolves(expectedUser);

			const user = await deserialize(
				makeFakeMessage({session: {school: 'school'}, _table: 'school'}),
				'__school__:1234',
			);

			expect(user).to.equal(expectedUser);
			expect(getUser.calledWithExactly('1234', 'school')).to.be.true;
		});
	});

	it('createSerializer', async function () {
		const serialize = promisify(_module.serializeUser);

		/** @type {object} */
		const profile = {
			name: 'user',
		};

		try {
			await serialize(makeFakeMessage(), profile);
			throw new Error('Expected failure');
		} catch (error) {
			expect(error.message, 'unknown profile schema').to.contain('Unknown profile');
			expect(error.context).to.equal(profile);
		}

		profile.id = 'test';
		expect(await serialize(makeFakeMessage(), profile), 'server with no host matching').to.equal(`null:${profile.id}`);

		profile.isNew = true;
		expect(await serialize(makeFakeMessage(), profile), 'new user').to.equal(`__school__:${profile.id}`);

		profile.isNew = false;

		expect(
			await serialize(makeFakeMessage({_table: 'school'}), profile),
			'server with host matching',
		).to.equal(`school:${profile.id}`);

		delete profile.id;

		profile.school = 'school';
		// eslint-disable-next-line camelcase
		profile.school_id = 'id';

		expect(
			await serialize(makeFakeMessage(), profile),
			'auth',
		).to.equal('school:id');
	});
});
