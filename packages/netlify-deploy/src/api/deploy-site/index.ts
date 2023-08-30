import {rm} from 'fs/promises';
import cleanDeep from 'clean-deep';
import {temporaryDirectory} from 'tempy';
import {api} from '../netlify-hardcoded-api.js';
import {hashFiles} from './hash-files.js';
import {uploadFiles} from './upload-files.js';
import {getUploadList, waitForDeploy, waitForDiff} from './util.js';

// Local deploy timeout: 20 mins
const DEFAULT_DEPLOY_TIMEOUT = 1.2e6;
// Concurrent file hash calls
const DEFAULT_CONCURRENT_HASH = 1e2;
// Number of concurrent uploads
const DEFAULT_CONCURRENT_UPLOAD = 5;
// Number of files
const DEFAULT_SYNC_LIMIT = 1e2;
// Number of times to retry an upload
const DEFAULT_MAX_RETRY = 5;

export interface DeploySiteOptions {
	deployId: string;
	filter: (filename?: string | null) => boolean;
	assetType?: string;
	concurrentHash?: number;
	concurrentUpload?: number;
	deployTimeout?: number;
	draft?: boolean;
	hashAlgorithm?: string;
	maxRetry?: number;
	message?: string;
	statusCb?: (status: {phase: string; msg: string}) => void;
	syncFileLimit?: number;
	tmpDir?: string;
}

export const deploySite = async (
	siteId: string,
	dir: string,
	{
		assetType,
		concurrentHash = DEFAULT_CONCURRENT_HASH,
		concurrentUpload = DEFAULT_CONCURRENT_UPLOAD,
		deployId,
		deployTimeout = DEFAULT_DEPLOY_TIMEOUT,
		draft = false,
		filter,
		hashAlgorithm,
		maxRetry = DEFAULT_MAX_RETRY,
		// API calls this the 'title'
		message: title,
		statusCb = () => {
			/* Default to noop */
		},
		syncFileLimit = DEFAULT_SYNC_LIMIT,
		tmpDir: temporaryDir = temporaryDirectory(),
	}: DeploySiteOptions,
) => {
	statusCb({
		msg: 'Hashing files...',
		phase: 'start',
	});

	const {files, filesShaMap} = await hashFiles({
		assetType,
		concurrentHash,
		directory: dir,
		filter,
		hashAlgorithm,
		normalizer: file => file,
		statusCb,
	});

	const filesCount = Object.keys(files).length;
	const stats = buildStatsString([
		filesCount > 0 && `${filesCount} files`,
	]);

	statusCb({
		msg: `Finished hashing ${stats}`,
		phase: 'stop',
	});

	if (filesCount === 0) {
		throw new Error('No files to deploy');
	}

	statusCb({
		msg: 'CDN diffing files...',
		phase: 'start',
	});

	const deployParameters_ = cleanDeep({
		deployId,
		siteId,
		title,
		body: {
			files,
			async: Object.keys(files).length > syncFileLimit,
			draft,
		},
	});

	const deployParameters = deployParameters_ as Required<typeof deployParameters_>;

	let deploy = await api.updateSiteDeploy(deployParameters);

	if (deployParameters.body.async) {
		deploy = await waitForDiff(deploy.id, siteId, deployTimeout);
	}

	const {required: requiredFiles} = deploy;

	statusCb({
		msg: `CDN requesting ${requiredFiles.length} files`,
		phase: 'stop',
	});

	const uploadList = getUploadList(requiredFiles, filesShaMap);

	await uploadFiles(deployId, uploadList, {concurrentUpload, statusCb, maxRetry});

	statusCb({
		msg: 'Waiting for deploy to go live...',
		phase: 'start',
	});
	deploy = await waitForDeploy(deployId, siteId, deployTimeout);

	statusCb({
		msg: draft ? 'Draft deploy is live!' : 'Deploy is live!',
		phase: 'stop',
	});

	await rm(temporaryDir, {force: true, recursive: true});

	const deployManifest = {
		deployId,
		deploy,
		uploadList,
	};
	return deployManifest;
};

const buildStatsString = (possibleParts: Array<string | undefined | false>) => {
	const parts = possibleParts.filter(Boolean);
	const message = parts.slice(0, -1).join(', ');

	return parts.length > 1 ? `${message} and ${parts.at(-1)}` : message;
};
