import flushWriteStream from 'flush-write-stream';
import hasha from 'hasha';
import transform from 'parallel-transform';
import {objCtor as objectFilterCtor} from 'through2-filter';
import {obj as map} from 'through2-map';
import {normalizePath} from './util.js';

export interface PartialFileObject {
	assetType: string;
	relname: string;
	normalizedPath: string;
	hash: string;
	filepath: string;
}

// A parallel transform stream segment ctor that hashes fileObj's created by folder-walker
// TODO: use promises instead of callbacks
export const hasherCtor = ({concurrentHash, hashAlgorithm}: {concurrentHash: number; hashAlgorithm: string}) => {
	const hashaOptions = {algorithm: hashAlgorithm};
	if (!concurrentHash) {
		throw new Error('Missing required opts');
	}

	return transform(concurrentHash, {objectMode: true}, async (fileObject, cb) => {
		try {
			const hash = await hasha.fromFile(fileObject.filepath, hashaOptions);
			// Insert hash and asset type to file obj
			return cb(null, {...fileObject, hash});
		} catch (error: unknown) {
			return cb(error as any);
		}
	});
};

// Inject normalized file names into normalizedPath and assetType
export const fileNormalizerCtor = ({assetType, normalizer: normalizeFunction}: {assetType: string; normalizer: (notNormalized: PartialFileObject) => PartialFileObject}) =>
	map((fileObject: PartialFileObject) => {
		const normalizedFile = {...fileObject, assetType, normalizedPath: normalizePath(fileObject.relname)};

		if (normalizeFunction !== undefined) {
			return normalizeFunction(normalizedFile);
		}

		return normalizedFile;
	});

// A writable stream segment ctor that normalizes file paths, and writes shaMap's
export const manifestCollectorCtor = (
	filesObject: Record<string, string>, shaMap: Record<string, PartialFileObject[]>, {assetType, statusCb}: {assetType: string; statusCb: (state: {msg: string; phase: string}) => unknown},
) => {
	if (!statusCb || !assetType) {
		throw new Error('Missing required options');
	}

	return flushWriteStream.obj((fileObject: PartialFileObject, _, cb) => {
		filesObject[fileObject.normalizedPath] = fileObject.hash;

		// We map a hash to multiple fileObj's because the same file
		// might live in two different locations

		if (Array.isArray(shaMap[fileObject.hash])) {
			shaMap[fileObject.hash].push(fileObject);
		} else {
			shaMap[fileObject.hash] = [fileObject];
		}

		statusCb({
			msg: `Hashing ${fileObject.relname}`,
			phase: 'progress',
		});
		cb(null as any);
	});
};

// Transform stream ctor that filters folder-walker results for only files
export const fileFilterCtor = objectFilterCtor(fileObject => fileObject.type === 'file');
