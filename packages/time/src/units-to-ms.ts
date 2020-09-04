/**
 * Converts a time (e.g. 1d4m) to the equivalent milliseconds.
 *
 * Supported units (order does not matter): days, hours, minutes and seconds
 *
 */
export function unitsToMs(timeString: string): number {
	const times = timeString.match(/(\d+[a-z])/g);

	if (!times) {
		throw new Error(`Invalid time: ${timeString}`);
	}

	if (times.length === 1) {
		const [time] = times;
		const unit = time.slice(-1).toLowerCase();
		const duration = Number(time.slice(0, -1));
		if (unit === 'd') {
			// 1 day in milliseconds
			return 86_400_000 * duration;
		}

		if (unit === 'h') {
			// 1 hour in milliseconds
			return 3600_000 * duration;
		}

		if (unit === 'm') {
			// 1 minute in milliseconds
			return 60_000 * duration;
		}

		if (unit === 's') {
			return 1000 * duration;
		}
	}

	// eslint-disable-next-line unicorn/no-reduce
	return times.reduce((current, match) => current + unitsToMs(match), 0);
}

export default unitsToMs;
