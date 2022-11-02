import {promisify} from 'util';
import walker from 'folder-walker';
import pumpCallback from 'pump';
import {
	fileFilterCtor, fileNormalizerCtor, hasherCtor, manifestCollectorCtor, type PartialFileObject,
} from './hasher-segments.js';

const pump = promisify(pumpCallback);

export interface HashFilesOptions {
	assetType?: string;
	concurrentHash: number;
	directory: string;
	filter: (filename: string) => boolean;
	hashAlgorithm?: string;
	normalizer: (fileName: PartialFileObject) => PartialFileObject;
	statusCb: (status: {phase: string; msg: string}) => void;
}

export const hashFiles = async ({
	assetType = 'file',
	concurrentHash,
	directory,
	filter,
	hashAlgorithm = 'sha1',
	normalizer,
	statusCb,
}: HashFilesOptions) => {
	if (!filter) {
		throw new Error('Missing filter function option');
	}

	const fileStream = walker([directory], {filter});
	const fileFilter = fileFilterCtor();
	const hasher = hasherCtor({concurrentHash, hashAlgorithm});
	const fileNormalizer = fileNormalizerCtor({assetType, normalizer});

	// Written to by manifestCollector
	// normalizedPath: hash (wanted by deploy API)
	const files = {};
	// Hash: [fileObj, fileObj, fileObj]
	const filesShaMap = {};
	const manifestCollector = manifestCollectorCtor(files, filesShaMap, {statusCb, assetType});

	await pump(fileStream, fileFilter, hasher, fileNormalizer, manifestCollector);

	return {files, filesShaMap};
};
