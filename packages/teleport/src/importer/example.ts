import {readFileSync} from 'fs';
import {generateAPICalls} from './api';
import {ValidationError} from './errors';

const exampleExport = readFileSync('./export.json');

try {
	console.log(generateAPICalls(exampleExport, {gid: '206221626381630023572'}));
} catch (error) {
	if (error instanceof ValidationError) {
		console.log(error.message);
	} else {
		console.error(error);
	}
}
