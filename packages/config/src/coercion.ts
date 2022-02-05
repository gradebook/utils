import type {Provider} from 'nconf';

export const coerceToBoolean = (source: unknown): boolean => {
	if (
		source === null
		|| !source
		|| source === 'false'
		|| source == '0' // eslint-disable-line eqeqeq
	) {
		return false;
	}

	return true;
};

export const coerceKeyToBoolean = (config: Provider, key: string): void => {
	config.set(key, coerceToBoolean(config.get(key)));
};

