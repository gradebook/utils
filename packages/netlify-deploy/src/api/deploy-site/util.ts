import {sep} from 'path';
import pWaitFor from 'p-wait-for';
import type {NetlifySiteDeploy} from '../open-api.js';
import {api} from '../netlify-hardcoded-api.js';
import type {PartialFileObject} from './hasher-segments.js';

const DEPLOY_POLL = 1e3;

// Normalize windows paths to unix paths
export const normalizePath = (relname: string) => {
	if (relname.includes('#') || relname.includes('?')) {
		throw new Error(`Invalid filename ${relname}. Deployed filenames cannot contain # or ? characters`);
	}

	return (
		relname
			.split(sep)
		// .map(segment => encodeURI(segment)) // TODO I'm fairly certain we shouldn't encodeURI here, thats only for the file upload step
			.join('/')
	);
};

// Poll an async deployId until its done diffing
export const waitForDiff = async (deployId: string, siteId: string, timeout: number) => {
	// Capture ready deploy during poll
	let deploy: NetlifySiteDeploy;

	const loadDeploy = async () => {
		const siteDeploy = await api.getSiteDeploy({siteId, deployId});

		switch (siteDeploy.state) {
			// https://github.com/netlify/bitballoon/blob/master/app/models/deploy.rb#L21-L33
			case 'error': {
				const deployError = new Error(`Deploy ${deployId} had an error`);
				// @ts-expect-error gb: not worth fixing
				deployError.deploy = siteDeploy;
				throw deployError;
			}

			case 'prepared':
			case 'uploading':
			case 'uploaded':
			case 'ready': {
				deploy = siteDeploy;
				return true;
			}

			case 'preparing': // eslint-disable-line unicorn/no-useless-switch-case
			default: {
				return false;
			}
		}
	};

	await pWaitFor(loadDeploy, {
		interval: DEPLOY_POLL,
		timeout,
		// @ts-expect-error gb: maybe types are wrong?
		message: 'Timeout while waiting for deploy',
	});

	// @ts-expect-error gb: pWaitFor ensures deploy is defined
	return deploy;
};

// Poll a deployId until its ready
export const waitForDeploy = async (deployId: string, siteId: string, timeout: number) => {
	// Capture ready deploy during poll
	let deploy: NetlifySiteDeploy;

	const loadDeploy = async () => {
		const siteDeploy = await api.getSiteDeploy({siteId, deployId});
		switch (siteDeploy.state) {
			// https://github.com/netlify/bitballoon/blob/master/app/models/deploy.rb#L21-L33
			case 'error': {
				const deployError = new Error(`Deploy ${deployId} had an error`);
				// @ts-expect-error gb: not worth fixing
				deployError.deploy = siteDeploy;
				throw deployError;
			}

			case 'ready': {
				deploy = siteDeploy;
				return true;
			}

			case 'preparing': // eslint-disable-line unicorn/no-useless-switch-case
			case 'prepared': // eslint-disable-line unicorn/no-useless-switch-case
			case 'uploaded': // eslint-disable-line unicorn/no-useless-switch-case
			case 'uploading': // eslint-disable-line unicorn/no-useless-switch-case
			default: {
				return false;
			}
		}
	};

	await pWaitFor(loadDeploy, {
		interval: DEPLOY_POLL,
		timeout,
		// @ts-expect-error gb: maybe types are wrong?
		message: 'Timeout while waiting for deploy',
	});

	// @ts-expect-error gb: pWaitFor ensures deploy is defined
	return deploy;
};

// Transform the fileShaMap and fnShaMap into a generic shaMap that file-uploader.js can use
export const getUploadList = (required: string[], shaMap: Record<string, PartialFileObject[]>) => {
	if (!required || !shaMap) {
		return [];
	}

	return required.flatMap(sha => shaMap[sha]);
};
