// @ts-check
import {readFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {expect} from 'chai';
import {migrate} from '../lib/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string | string[]} firstLogLines
 * @param {string | string[]} secondLogLines
 */
function assertLogFilesAreEqual(firstLogLines, secondLogLines) {
	const first = Array.isArray(firstLogLines) ? firstLogLines : firstLogLines.split('\n');
	const second = Array.isArray(secondLogLines) ? secondLogLines : secondLogLines.split('\n');

	expect(first.length, 'Files are same length').to.equal(second.length);
	const parseJson = (lineContents, lineNumber, fileName) => {
		try {
			return JSON.parse(lineContents);
		} catch (error) {
			if (error.name === 'SyntaxError') {
				error.message += ` when parsing ${fileName}:${lineNumber}`;
			}

			throw error;
		}
	};

	for (const [index, currentFirstLine] of first.entries()) {
		if (currentFirstLine) {
			const leftParsed = parseJson(currentFirstLine, index, 'left');
			const rightParsed = parseJson(second[index], index, 'right');

			// If both the left and right have no message or are empty, we can ignore it for comparison
			if (!leftParsed.msg && !rightParsed.msg) {
				delete leftParsed.msg;
				delete rightParsed.msg;
			}

			// Request IDs aren't guaranteed to exist in the Bunyan log format
			if (!leftParsed.req?.id && rightParsed.req?.id) {
				delete rightParsed.req.id;
			}

			expect(leftParsed).to.deep.equal(rightParsed);
		} else {
			expect(currentFirstLine).to.equal(second[index]);
		}
	}
}

const fixture = name => path.resolve(__dirname, `./fixtures/${name}`);

describe('Unit > Migrate', function () {
	it('Bunyan general logs can be migrated to Pino format', function () {
		const migrated = migrate(readFileSync(fixture('bunyan.log'), 'utf8'), 'migration_test', 'development');
		expect(migrated.foundValidLine).to.be.true;
		expect(migrated.failedLines.length).to.equal(0);
		assertLogFilesAreEqual(migrated.migratedLines, readFileSync(fixture('pino.log'), 'utf8'));
	});

	it('Bunyan error logs can be migrated to Pino format', function () {
		const migrated = migrate(readFileSync(fixture('bunyan.error.log'), 'utf8'), 'migration_test', 'development');
		expect(migrated.foundValidLine).to.be.true;
		expect(migrated.failedLines.length).to.equal(0);
		assertLogFilesAreEqual(migrated.migratedLines, readFileSync(fixture('pino.error.log'), 'utf8'));
	});
});
