import date from 'dayjs';
import objectId from 'bson-objectid';
import {IncomingMessage} from 'http';

import {
	PassportOauth20Profile as Profile,
	PassportOauth20VerifyCallback as VerifyCallback
} from './_passport-types';

export type NewUserSessionProfile = {
	id: string;
	gid: string;
	firstName: string;
	lastName: string;
	email: string;
	isNew: true;
	settings: string;
};

export type UserProfile = {
	id: string;
	isNew: boolean;
} | {
	school: string;
	school_id: string; // eslint-disable-line camelcase
};

export interface BasicRequest extends IncomingMessage {
	session: {
		userProfile?: NewUserSessionProfile;
		school?: string;
	};
	_table?: string;
	_passportRedirect?: string;
}

export type BasicCallback<T = string> = (error?: Error, id?: T) => void;

export function createProfileHandler(getUser: (gid: string, table: string) => Promise<UserProfile>) {
	return async function handleProfile(
		request: BasicRequest,
		_: string,
		__: string,
		profile: Profile,
		callback: VerifyCallback
	): Promise<void> {
		let user: object | NewUserSessionProfile;

		try {
			user = await getUser(profile.id, request._table);

			if (user) {
				callback(null, user);
				return;
			}
		} catch (error) {
			callback(error);
			return;
		}

		const {id: gid, emails, displayName, name: {givenName: firstName, familyName: lastName}} = profile;
		let firstNameFallback = displayName.slice(0, displayName.indexOf(' '));
		let lastNameFallback = displayName.slice(displayName.indexOf(' ') + 1);

		if (!firstNameFallback || !lastNameFallback) {
			firstNameFallback = 'Student';
			lastNameFallback = '';
		}

		const id = objectId.generate();
		user = {
			id,
			gid,
			firstName: firstName || firstNameFallback,
			lastName: lastName || lastNameFallback,
			email: emails[0].value,
			isNew: true,
			// https://github.com/tgriesser/knex/issues/2649
			settings: JSON.stringify({
				tour: false,
				previous_notification: date().format('YYYY-MM-DDTHH:mm:ss.000-06:00') // eslint-disable-line camelcase
			})
		};

		request.session.userProfile = user as NewUserSessionProfile;

		// NOTE: serialization occurs with what is provided in the callback!
		callback(null, user);
	};
}

export function createUserDeserializer(
	getUser: (id: string, school: string) => Promise<UserProfile>,
	domain: string | false = false
): (request: BasicRequest, profile: string, callback: BasicCallback<UserProfile | object>) => Promise<void> {
	domain = typeof domain === 'string' ? domain.replace(/^\./, '') : domain;

	return async function deserializeUser(
		request: BasicRequest,
		profile: string,
		callback: BasicCallback<UserProfile | object>
	): Promise<void> {
		// CASE: user has not approved their account
		if (request.session.userProfile) {
			return callback(null, request.session.userProfile);
		}

		if (!profile.includes(':')) {
			return callback(new Error(`Deserializer: Unable to parse profile: ${profile}`));
		}

		let [school, id] = profile.split(':');

		if (school === '__school__') {
			school = request.session.school;
		}

		school = school === 'null' ? null : school;

		if (domain && request._table && school !== request._table) {
			request._passportRedirect = `//${school}.${domain}/my/`;
			return callback(null, {});
		}

		try {
			const user = await getUser(id, school);

			if (!user) {
				return callback(null, null);
			}

			return callback(null, user);
		} catch (error) {
			return callback(error);
		}
	};
}

export function serializeUser(
	request: BasicRequest,
	profile: UserProfile,
	callback: BasicCallback
): void {
	// CASE: full user object
	if ('id' in profile) {
		// CASE: User is new so return the special school identifier
		if (profile.isNew) {
			return callback(null, `__school__:${profile.id}`);
		}

		const table = request._table || null;

		return callback(null, `${table}:${profile.id}`);
	}

	// CASE: user reference object
	if ('school' in profile && 'school_id' in profile) {
		return callback(null, `${profile.school}:${profile.school_id}`);
	}

	const error = new Error('Serializer: Unknown profile');
	// @ts-ignore
	error.context = profile;
	return callback(error);
}
