import process from 'process';
import fs from 'fs/promises';
import path from 'path';

export const DEFAULT_CONFIG = 'config.example.json';

async function fileExists(filePath: string): Promise<boolean> {
	try {
		const result = await fs.stat(filePath);
		return result.isFile();
	} catch {
		return false;
	}
}

export async function _recursiveSearch(currentContext: string, fileName: string): Promise<string | null> {
	if (currentContext === '/') {
		return null;
	}

	const proposal = await fileExists(path.resolve(currentContext, fileName));

	if (proposal) {
		return currentContext;
	}

	return _recursiveSearch(path.resolve(currentContext, '../'), fileName);
}

export async function findRoot(env: string): Promise<string> {
	const envConfig = `config.${env}.json`;

	const root = await _recursiveSearch(process.cwd(), envConfig);

	if (!root) {
		throw new Error('Unable to find config');
	}

	return root;
}
