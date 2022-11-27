
export type Throttler = () => boolean;

export function createThrottler(minimumDelay: number): Throttler {
	let nextTimestamp = 0;

	return () => {
		const currentTime = Date.now();
		if (nextTimestamp >= currentTime) {
			nextTimestamp = currentTime + minimumDelay;
			return true;
		}

		return false;
	};
}
