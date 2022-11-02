/*
* The passport-goolge-oauth20 types are hopelessly broken because of
*  express-serve-static-core so these are the flattened types that
*  are used in this package from @types/passport-google-oauth20
*/

export interface PassportOauth20Profile {
	provider: string;
	id: string;
	displayName: string;
	username?: string;
	name?: {
		familyName: string;
		givenName: string;
		middleName?: string;
	};
	emails?: Array<{
		value: string;
		type?: string;
	}>;
	photos?: Array<{
		value: string;
	}>;
	profileUrl: string;

	_raw: string;
	_json: any;
}

export type PassportOauth20VerifyCallback = (error?: string | Error, user?: any, info?: any) => void;
