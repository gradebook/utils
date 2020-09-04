
/**
 * Computes the timezone difference between the server time and {timeZone}
 */
export function getOffset(timeZone: string): number {
	const now = new Date();
	const hourHere = now.toLocaleTimeString(undefined, {hour12: false}).split(':').shift();
	const hourThere = now.toLocaleTimeString(undefined, {timeZone, hour12: false}).split(':').shift();

	return (Number(hourHere) - Number(hourThere)) % 24;
}

export default getOffset;
