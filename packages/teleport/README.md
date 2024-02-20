# `@gradebook/teleport`

> Move data across @gradebook/server instances

## Importer

> Generate SQL-like queries to import a user into an @gradebook/server database

### Usage

```ts
import {readFileSync} from 'fs';
import {generateAPICalls} from './importer';
import {ValidationError} from './errors';

const exampleExport = readFileSync('./export.json');

try {
	console.log(generateAPICalls(exampleExport, {schemaVersion: '2', gid: '206221626381630023572'}));
} catch (error) {
	if (error instanceof ValidationError) {
		console.log(error.message);
	} else {
		console.error(error);
	}
}
```
