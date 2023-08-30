/* eslint-disable @typescript-eslint/ban-types */
import type {IncomingMessage} from 'http';
import {dayjs as date} from '@gradebook/time';
import ObjectId from 'bson-objectid';
import type {
	PassportOauth20Profile as Profile,
	PassportOauth20VerifyCallback as VerifyCallback,
} from './_passport-types.js';

export interface NewUserSessionProfile {
	id: string;
	gid: string;
	firstName: string;
	lastName: string;
	email: string;
	isNew: true;
	settings: string;
}

export type UserProfile = {
	id: string;
	isNew: boolean;
} | {
	school: string;
	school_id: string;
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

export function createProfileHandler(getUser: (gid: string, table: string | undefined) => Promise<UserProfile>) {
	return async function handleProfile(
		request: BasicRequest,
		_: string,
		__: string,
		profile: Profile,
		callback: VerifyCallback,
	): Promise<void> {
		let user: object | NewUserSessionProfile;

		try {
			user = await getUser(profile.id, request._table);

			if (user) {
				callback(null!, user);
				return;
			}
		} catch (error) {
			callback(error as string | Error);
			return;
		}

		const {id: gid, emails} = profile;
		const {firstName, lastName} = _parseNameFromGoogle(profile);

		const id = new ObjectId().toHexString();
		user = {
			id,
			gid,
			firstName,
			lastName,
			email: emails![0].value,
			isNew: true,
			// https://github.com/tgriesser/knex/issues/2649
			settings: JSON.stringify({
				tour: false,
				previous_notification: date().format('YYYY-MM-DDTHH:mm:ss.000-06:00'), // eslint-disable-line camelcase
			}),
		};

		request.session.userProfile = user as NewUserSessionProfile;

		// NOTE: serialization occurs with what is provided in the callback!
		callback(null!, user);
	};
}

export function createUserDeserializer(
	getUser: (id: string, school: string | null) => Promise<UserProfile>,
	domain: string | false = false,
): (request: BasicRequest, profile: string, callback: BasicCallback<UserProfile | object>) => Promise<void> {
	domain = typeof domain === 'string' ? domain.replace(/^\./, '') : domain;

	return async function deserializeUser(
		request: BasicRequest,
		profile: string,
		callback: BasicCallback<UserProfile | object>,
	): Promise<void> {
		// CASE: user has not approved their account
		if (request.session.userProfile) {
			callback(null!, request.session.userProfile);
			return;
		}

		if (!profile.includes(':')) {
			callback(new Error(`Deserializer: Unable to parse profile: ${profile}`));
			return;
		}

		let school: string | null;
		let id: string;

		([school, id] = profile.split(':'));

		if (school === '__school__') {
			school = request.session.school!;
		}

		school = school === 'null' ? null : school;

		if (domain && request._table && school !== request._table) {
			request._passportRedirect = `//${school}.${domain}/my/`;
			callback(null!, {});
			return;
		}

		try {
			const user = await getUser(id, school);

			if (!user) {
				callback(null!, null!);
				return;
			}

			callback(null!, user);
		} catch (error) {
			callback(error as Error);
		}
	};
}

export function serializeUser(
	request: BasicRequest,
	profile: UserProfile,
	callback: BasicCallback,
): void {
	// CASE: full user object
	if ('id' in profile) {
		// CASE: User is new so return the special school identifier
		if (profile.isNew) {
			callback(null!, `__school__:${profile.id}`);
			return;
		}

		const table = request._table ?? null;

		callback(null!, `${table}:${profile.id}`);
		return;
	}

	// CASE: user reference object
	if ('school' in profile && 'school_id' in profile) {
		callback(null!, `${profile.school}:${profile.school_id}`);
		return;
	}

	const error = new Error('Serializer: Unknown profile');
	// @ts-expect-error error context is used by Ignition
	error.context = profile;
	callback(error);
}

export function _parseNameFromGoogle(
	{displayName, name: {givenName, familyName} = {} as {givenName: string; familyName: string}}: Profile,
): {firstName: string; lastName: string} {
	let firstName = givenName;
	let lastName = familyName;
	let firstNameFallback = displayName;
	let lastNameFallback = '';

	// CASE: displayName can be split
	if (displayName.includes(' ')) {
		firstNameFallback = displayName.slice(0, displayName.indexOf(' ') + 1);
		lastNameFallback = displayName.slice(displayName.indexOf(' ') + 1);
	}

	// CASE: There was no display name
	if (!displayName) {
		firstNameFallback = 'Student';
		lastNameFallback = '';
	}

	// CASE: Only last name was given. Use as first name since that is more important i.e. "Howdy, {{firstName}}!"
	if (familyName && !displayName) {
		firstName = familyName;
		lastName = '';
	}

	firstName = firstName || firstNameFallback;
	lastName = lastName || lastNameFallback;

	return {firstName, lastName};
}
