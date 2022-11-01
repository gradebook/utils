import type {EventEmitter} from 'stream';
import fs from 'fs';

import backoff from 'backoff';
import pMap from 'p-map';
import {api} from '../netlify-hardcoded-api.js';
import {NetlifyUploadFile} from '../open-api.js';
import {PartialFileObject} from './hasher-segments.js';

type FakeFibonacci = EventEmitter & {
	failAfter: (duration: number) => void;
	backoff: () => void;
};

const UPLOAD_RANDOM_FACTOR = 0.5;
// 5 seconds
const UPLOAD_INITIAL_DELAY = 5e3;
// 1.5 minute
const UPLOAD_MAX_DELAY = 9e4;

export const uploadFiles = async (deployId: string, uploadList: PartialFileObject[], {concurrentUpload, maxRetry, statusCb}: {concurrentUpload: number; maxRetry: number; statusCb: (status: {msg: string; phase: string}) => unknown}) => {
	if (!concurrentUpload || !statusCb || !maxRetry) {
		throw new Error('Missing required option concurrentUpload');
	}

	statusCb({
		msg: `Uploading ${uploadList.length} files`,
		phase: 'start',
	});

	const uploadFile = async (fileObject: PartialFileObject, _: number) => {
		const {assetType, filepath, normalizedPath} = fileObject;

		let response: NetlifyUploadFile;
		switch (assetType) {
			case 'file': {
				statusCb({msg: `Uploading ${filepath}`, phase: 'start'});
				response = await retryUpload(
					async () => api.uploadDeployFile({
						body: fs.createReadStream(filepath),
						deployId,
						path: encodeURI(normalizedPath),
					}),
					maxRetry,
				);
				statusCb({msg: `Uploading ${filepath}`, phase: 'stop'});
				break;
			}

			default: {
				const error = new Error('File Object missing assetType property');
				// @ts-expect-error gb: not worth handling this case
				error.fileObj = fileObject;
				throw error;
			}
		}

		return response;
	};

	const results = await pMap(uploadList, uploadFile, {concurrency: concurrentUpload});
	statusCb({
		msg: `Finished uploading ${uploadList.length} files`,
		phase: 'stop',
	});
	return results;
};

const retryUpload = async <T>(uploadFn: (count: number) => Promise<T>, maxRetry: number) =>
	new Promise<T>((resolve, reject) => {
		let lastError: unknown;

		const fibonacciBackoff = backoff.fibonacci({
			randomisationFactor: UPLOAD_RANDOM_FACTOR,
			initialDelay: UPLOAD_INITIAL_DELAY,
			maxDelay: UPLOAD_MAX_DELAY,
		}) as FakeFibonacci;

		const tryUpload = async (retryIndex = -1) => {
			try {
				const results = await uploadFn(retryIndex + 1);

				return resolve(results);
			} catch (error: unknown) {
				lastError = error;

				// Observed errors: 408, 401 (4** swallowed), 502
				if ((error as any).status >= 400 || (error as any).name === 'FetchError') {
					fibonacciBackoff.backoff();
					return;
				}

				return reject(error);
			}
		};

		fibonacciBackoff.failAfter(maxRetry);

		fibonacciBackoff.on('backoff', () => {
			// Do something when backoff starts, e.g. show to the
			// user the delay before next reconnection attempt.
		});

		fibonacciBackoff.on('ready', tryUpload);

		fibonacciBackoff.on('fail', () => {
			reject(lastError);
		});

		void tryUpload();
	});
