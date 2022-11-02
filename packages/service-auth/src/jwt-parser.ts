import {jwtVerify, type JWTVerifyGetKey} from 'jose';

export interface GatewayToken {
	integration: string;
}

export const IS_403 = 'Access denied';

export async function readJwt(
	keyStore: JWTVerifyGetKey, token: string, audience: string | string[],
): Promise<GatewayToken | string> {
	const decryptedToken = await jwtVerify(token, keyStore, {audience})
		.catch((error: unknown) => {
			if (error && typeof error === 'object' && (error as any).code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
				return IS_403;
			}

			return 'Unable to get keys from Gateway, or invalid JWT';
		});

	if (typeof decryptedToken === 'string' || typeof decryptedToken.payload.id !== 'string') {
		return typeof decryptedToken === 'string' ? decryptedToken : 'Invalid JWT';
	}

	const response: Partial<GatewayToken> = {
		integration: decryptedToken.payload.id,
	};

	return response as GatewayToken;
}
