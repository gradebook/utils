import {constants, copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'fs';
import path from 'path';
import {argv, exit, stdout} from 'process';

const BACKUPS_FOLDER = 'bunyan_backup';

const ENVs = new Set(['development', 'production']);

export function migrate(fileContents: string, domain: string, env: string) {
	const fileLines = fileContents.split('\n');

	const failedLines = [];
	const migratedLines = [];
	let foundValidLine = false;

	for (const [index, line] of fileLines.entries()) {
		if (line === '') {
			continue;
		}

		let parsedLine: unknown;
		try {
			parsedLine = JSON.parse(line);
		} catch {
			failedLines.push(index);
			continue;
		}

		if (parsedLine && typeof parsedLine === 'object' && (parsedLine as any).v === 0) {
			migratedLines.push(migrateLine(parsedLine, domain, env));
			foundValidLine = true;
		} else {
			failedLines.push(index);
		}
	}

	// The last line of a log file is always empty to allow for append-only logging
	migratedLines.push('');

	return {foundValidLine, migratedLines, failedLines};
}

/* c8 ignore start */
export function autorun() { // eslint-disable-line complexity
	if (argv.length !== 5) {
		usage();
	}

	const domain = argv[2].toLocaleLowerCase();
	const env = argv[3].toLocaleLowerCase();
	const rawDirectory = argv[4];
	const directory = path.resolve(rawDirectory);

	if (!(env in ENVs)) {
		usage('Invalid env.' + domain in ENVs ? 'Did you switch domain and env?' : '');
	}

	try {
		const directoryStat = statSync(directory);
		if (!directoryStat.isDirectory()) {
			usage(`"${rawDirectory}" is not a directory`);
		}
	} catch (error: unknown) {
		let suffix = '';

		if (error && typeof error === 'object' && 'code' in error) {
			suffix = `. Code: ${(error as any).code}`; // @TODO: remove any cast when typescript is >= 4.9
		}

		usage(`Unable to enumerate "${rawDirectory}"${suffix}`);
	}

	const files = readdirSync(directory, {withFileTypes: true})
		.filter(entry => entry.isFile() && entry.name.includes('.log'))
		.map(file => file.name);

	if (files.length === 0) {
		usage('No .log files were found');
	}

	mkdirSync(path.resolve(directory, BACKUPS_FOLDER), {recursive: true});

	const partialLog = (line: string) => stdout.write(line);

	let successCount = 0;
	const partialSuccesses: Record<string, number[]> = {};
	for (const file of files) {
		partialLog(file);
		const absoluteFilePath = path.resolve(directory, file);
		let fileContents: string;

		try {
			fileContents = readFileSync(absoluteFilePath, 'utf8');
		} catch {
			console.log(' --> ❌: failed reading');
			continue;
		}

		const {foundValidLine, failedLines, migratedLines} = migrate(fileContents, domain, env);

		if (!foundValidLine) {
			console.log(' --> ❌: not interpreted as Bunyan/JSON-ND');
			continue;
		}

		if (failedLines.length > 0) {
			partialSuccesses[file] = failedLines;
			const plural = failedLines.length === 1 ? 'line' : 'lines';
			partialLog(` --> ✔: ${failedLines.length} ${plural} skipped`);
		} else {
			partialLog(' --> ✔: no issues');
		}

		const backupFilePath = path.resolve(directory, BACKUPS_FOLDER, `${file}.bak`);
		try {
			copyFileSync(absoluteFilePath, backupFilePath, constants.COPYFILE_EXCL);
		} catch {
			console.log(' but unable to make a backup');
			continue;
		}

		successCount++;
		console.log();
		writeFileSync(absoluteFilePath, migratedLines.join('\n'));
	}

	if (successCount === 0) {
		console.error('No files were migrated');
		exit(0);
	}

	logSectionBreak();

	const failureIterator = Object.entries(partialSuccesses);

	if (failureIterator.length > 0) {
		console.log('Partial Migrations:');
		for (const [file, lines] of failureIterator) {
			console.log(` File: ${file}`);
			let buffer = ' Skipped Line(s): ' + String(lines.shift()!);
			const lastLine = lines.pop();
			for (const line of lines) {
				const lineAsString = `, ${line}`;
				if (buffer.length + lineAsString.length > 100) {
					console.log(buffer);
					buffer = '  ';
				}

				buffer += lineAsString;
			}

			if (lastLine) {
				buffer += `, and ${lastLine}`;
			}

			console.log(buffer);
		}

		logSectionBreak();
	}

	console.log('Summary:');
	console.log(` Fully migrated files: ${successCount}`);
	console.log(` Partially migrated files: ${failureIterator.length}`);
}

function usage(errorMessage?: string) {
	console.error('Bunyan to Pino migration utility');
	console.error(' Converts all Bunyan v0 jsonnd `.log`s in a directory to an');
	console.error(' @gradebook/logging (Pino) compatible format');
	console.error('\nUsage: @gradebook/logging/%s <domain> <env> <directory>', argv[1].split('/').pop());

	if (errorMessage) {
		console.error('\nError:', errorMessage);
	}

	exit(1);
}

function logSectionBreak() {
	console.log();
	console.log();
	console.log('-----------------------------------------------------------------');
	console.log();
}
/* c8 ignore stop */

/* eslint-disable @typescript-eslint/ban-types */
function migrateRequestKey(request: Record<string, unknown>, migrated: Record<string, unknown>) {
	if ('meta' in request) {
		const {meta} = request as {meta: object};
		if ('requestId' in meta) {
			migrated.id = (meta as {requestId: number | string}).requestId;
		}

		if ('userId' in meta) {
			migrated.userId = (meta as any).userId; // @TODO: remove any cast when typescript is >= 4.9
		}

		delete request.meta;
	}

	if ('query' in request && Object.keys(request.query as Record<string, unknown>).length === 0) {
		request.query = null;
	}

	migrated.req = request;
}

function migrateResponseKey(response: Record<string, unknown>, migrated: Record<string, unknown>) {
	if ('_headers' in response) {
		response.headers = response._headers;
		delete response._headers;
	}

	if ('statusCode' in response) {
		response.status = response.statusCode;
		delete response.statusCode;
	}

	if ('responseTime' in response) {
		migrated.responseTime = Number((response.responseTime as string).replace('ms', ''));
		delete response.responseTime;
	}

	migrated.res = response;
}

function migrateLine(line: object, domain: string, env: string) {
	const cloned: Record<string, unknown> = {domain, env, ...line};

	delete cloned.v;

	if ('req' in line) {
		delete cloned.req;
		// @TODO: remove any cast when typescript is >= 4.9
		migrateRequestKey((line as any).req as Record<string, unknown>, cloned);
	}

	if ('res' in line) {
		delete cloned.res;
		// @TODO: remove any cast when typescript is >= 4.9
		migrateResponseKey((line as any).res as Record<string, unknown>, cloned);
	}

	return JSON.stringify(cloned);
}

/* eslint-enable @typescript-eslint/ban-types */
