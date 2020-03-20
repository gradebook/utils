# `@gradebook/importer`

> TODO: description

## Usage

```ts
import {readFileSync} from 'fs';
import {generateAPICalls} from './importer';
import {ValidationError} from './errors';

const exampleExport = readFileSync('./export.json');

try {
	console.log(generateAPICalls(exampleExport));
} catch (error) {
	if (error instanceof ValidationError) {
		console.log(error.message);
	} else {
		console.error(error);
	}
}

```
