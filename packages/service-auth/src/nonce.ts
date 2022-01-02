import type {Request, Response} from 'express';

export function extractHeader(request: Request, key: string) {
	const value = request.headers[key];

	return Array.isArray(value) ? value[0] : value;
}

const history = Array.from({length: 128});
let currentIndex = 0;

export const __forTestOnlyHistory = history;

export function useNoopNonce() {
	return {
		assert() {
			return '';
		},

		track() {
			// Noop
		},
	};
}

export function useNonce() {
	return {
		assert(request: Request, response: Response) {
			const nonce = extractHeader(request, 'x-gateway-nonce');

			if (!nonce) {
				response.status(400).json({error: 'nonce is required'});
				return false;
			}

			if (history.includes(nonce)) {
				response.status(400).json({error: 'reused nonce'});
				return false;
			}

			return nonce;
		},

		track(nonce: string) {
			history[currentIndex] = nonce;
			currentIndex = (currentIndex + 1) % history.length;
		},
	};
}
