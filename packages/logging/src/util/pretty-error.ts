import { // eslint-disable-line import/no-extraneous-dependencies
	cyan as colorCyan,
	white as colorWhite,
	yellow as colorYellow,
	whiteBright as colorWhiteBright,
	gray as colorGray,
} from 'colorette';

const noop = (s: string) => s;

const COLOR_FUNCTIONS = {
	cyan: colorCyan,
	white: colorWhite,
	yellow: colorYellow,
	whiteBright: colorWhiteBright,
	gray: colorGray,
} as const;

const NO_COLOR_FUNCTIONS = {
	cyan: noop,
	white: noop,
	yellow: noop,
	whiteBright: noop,
	gray: noop,
} as const;

export function prettyError(error: Record<string, string>, useColors = false) {
	const {cyan, white, yellow, whiteBright, gray} = useColors ? COLOR_FUNCTIONS : NO_COLOR_FUNCTIONS;
	const levelColor = cyan;
	let response = '';

	if (error.errorType) {
		response += levelColor(`Type: ${error.errorType}`);
	}

	response += levelColor(error.message) + '\n\n';

	if (error.context) {
		response += white(error.context) + '\n';
	}

	if (error.help) {
		response += yellow(error.help) + '\n';
	}

	if (error.context || error.help) {
		response += '\n';
	}

	if (error.id) {
		response += whiteBright('Error ID: ') + gray(error.id) + '\n\n';
	}

	if (error.code) {
		response += whiteBright('Error Code:') + '\n';
		response += '    ' + gray(error.code) + '\n\n';
	}

	if (error.errorDetails) {
		let details = error.errorDetails;

		try {
			const jsonDetails: unknown = JSON.parse(error.errorDetails);
			details = Array.isArray(jsonDetails) ? (jsonDetails as string[])[0] : jsonDetails as string;
		} catch {
			// No need for special handling as we default to unparsed 'errorDetails'
		}

		response += whiteBright('Details:') + '\n';
		response += gray(JSON.stringify(details, null, 2)) + '\n\n';
	}

	if (error.stack && !error.hideStack) {
		response += gray('----------------------------------------') + '\n\n';
		response += gray(error.stack) + '\n';
	}

	return response;
}
