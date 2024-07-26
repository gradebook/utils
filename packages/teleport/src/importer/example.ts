import {readFileSync} from 'fs';
import {publicToRaw} from './public.js';
import {ValidationError} from './errors.js';

const exampleExport = readFileSync('./export.json');

try {
	console.log(publicToRaw(exampleExport, {schemaVersion: '2', gid: '206221626381630023572'}));
} catch (error) {
	if (error instanceof ValidationError) {
		console.log(error.message);
	} else {
		console.error(error);
	}
}
