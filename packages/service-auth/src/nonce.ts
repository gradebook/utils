import type {NextFunction, Request, Response} from 'express';

export function extractHeader(request: Request, key: string) {
	const value = request.headers[key];

	return Array.isArray(value) ? value[0] : value;
}

export function useNonce(size = 128) {
	const history: string[] = Array.from({length: size});
	let currentIndex = 0;
	return {
		assert(request: Request, response: Response, next: NextFunction) {
			const nonce = extractHeader(request, 'x-gateway-nonce');

			if (!nonce) {
				response.status(400).json({error: 'nonce is required'});
				next(new Error('Missing nonce'));
				return;
			}

			if (history.includes(nonce)) {
				response.status(400).json({error: 'reused nonce'});
				next(new Error('Reused nonce'));
				return;
			}

			return nonce;
		},

		track(nonce: string) {
			history[currentIndex] = nonce;
			currentIndex = (currentIndex + 1) % history.length;
		},
	};
}
