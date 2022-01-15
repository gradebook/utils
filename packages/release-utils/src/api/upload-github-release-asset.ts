import {readFile} from 'fs/promises';
import path from 'path';
import 'urijs/src/URITemplate.js'; // eslint-disable-line import/no-unassigned-import
import URI from 'urijs';
import mime from 'mime/lite.js';
import {findReleaseByTagName, FindReleaseByTagNameOptions, makeGitHubRequest} from './github.js';

export type Asset = string | [path: string, name: string];

export interface GitHubReleaseUploadParameters {
	token: string;
	ownerAndRepository: string;
	tagName: string;
}

export async function uploadGitHubReleaseAsset(url: string, asset: Asset, authToken: string): Promise<boolean> {
	let assetName: string;
	let assetPath: string;

	if (typeof asset === 'string') {
		assetName = path.basename(asset);
		assetPath = asset;
	} else {
		[assetPath, assetName] = asset;
	}

	try {
		const buffer = await readFile(assetPath);

		// @ts-expect-error mime types are off
		const type = mime.getType(assetPath) as string; // eslint-disable-line @typescript-eslint/no-unsafe-call

		if (!type) {
			throw new Error('Unable to determine mime type');
		}

		// `expand` is available because we `import 'urijs/src/URITemplate';`
		const fullUrl = URI.expand!(url, {name: assetName}).toString();
		await makeGitHubRequest(fullUrl, authToken, {method: 'POST', body: buffer, headers: {
			'content-type': type,
			'content-length': String(buffer.byteLength),
		}});
		return true;
	} catch (error: unknown) {
		console.error(`Failed uploading asset: "${assetName}" (${assetPath}):`);
		console.error(error);
		return false;
	}
}

/**
 * @returns the number of assets that failed to upload
 */
export async function uploadGitHubReleaseAssets(
	options: FindReleaseByTagNameOptions,
	assets: Asset[] | string,
): Promise<boolean[]> {
	const response = await findReleaseByTagName(options);

	if (typeof assets === 'string') {
		assets = [assets];
	}

	if (!response) {
		console.error('Unable to find release');
		return assets.map(() => false);
	}

	const {upload_url: url} = response;

	return Promise.all(assets.map(async asset => uploadGitHubReleaseAsset(url, asset, options.token)));
}
