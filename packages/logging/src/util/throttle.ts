
export type Throttler = () => boolean;

export function createThrottler(minimumDelay: number): Throttler {
	let nextTimestamp = -1;

	return () => {
		const currentTime = Date.now();
		if (currentTime >= nextTimestamp) {
			nextTimestamp = currentTime + minimumDelay;
			return true;
		}

		return false;
	};
}
