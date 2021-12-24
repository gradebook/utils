import {jwtVerify, JWTVerifyGetKey} from 'jose';

export interface GatewayToken {
	permissions: string[];
	integration: string;
}

export async function readJwt(keyStore: JWTVerifyGetKey, token: string): Promise<GatewayToken | string> {
	const decryptedToken = await jwtVerify(token, keyStore, {})
		.catch(() => 'Unable to get keys from Gateway, or invalid JWT');

	if (
		typeof decryptedToken === 'string'
		|| typeof decryptedToken.payload.id !== 'string'
		|| typeof decryptedToken.payload.permissions !== 'string'
	) {
		return typeof decryptedToken === 'string' ? decryptedToken : 'Invalid JWT';
	}

	const response: Partial<GatewayToken> = {
		integration: decryptedToken.payload.id,
	};

	try {
		const parsedPermissions: unknown = JSON.parse(decryptedToken.payload.permissions);
		if (!Array.isArray(parsedPermissions) || !parsedPermissions.every(permission => typeof permission === 'string')) {
			return 'Failed parsing permissions';
		}

		response.permissions = parsedPermissions;
	} catch {
		return 'Failed parsing permissions';
	}

	return response as GatewayToken;
}
