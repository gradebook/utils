// @ts-check
// Based on 36957fcba3f6355985446c67d673ef96edd448f1 of netlify/cli
import type {Stats} from 'fs';
import {stat} from 'fs/promises';
import {basename} from 'path';
import {exit} from 'process';
import {getProperty as get} from 'dot-prop';
import isObject from 'lodash.isobject';
import {cancelDeploy, api} from './netlify-hardcoded-api.js';
import {error, log, logJson, warn} from './netlify-compat-util.js';
import {deploySite} from './deploy-site/index.js';

type SiteData = Awaited<ReturnType<typeof api['getSite']>>;

const DEFAULT_DEPLOY_TIMEOUT_SEC = 1200;

const validateDeployFolder = async ({deployFolder}: {deployFolder: string}) => {
	let stats: Stats;
	try {
		stats = await stat(deployFolder);
	} catch (error_: unknown) {
		if (error_ && typeof error_ === 'object') {
			if ((error_ as any).code === 'ENOENT') {
				return error(`No such directory ${deployFolder}! Did you forget to run a build?`);
			}

			// Improve the message of permission errors
			if ((error_ as any).code === 'EACCES') {
				return error('Permission error when trying to access deploy folder');
			}
		}

		throw error_;
	}

	if (!stats.isDirectory()) {
		return error('Deploy target must be a path to a directory');
	}

	return stats;
};

const getDeployFilesFilter = ({deployFolder}) => {
	// Site.root === deployFolder can happen when users run `netlify deploy --dir .`
	// in that specific case we don't want to publish the repo node_modules
	// when site.root !== deployFolder the behaviour matches our buildbot
	const skipNodeModules = true;

	return (filename: string | null | undefined) => {
		if (!filename) {
			return false;
		}

		if (filename === deployFolder) {
			return true;
		}

		const base = basename(filename);
		const skipFile
			= (skipNodeModules && base === 'node_modules')
			|| (base.startsWith('.') && base !== '.well-known')
			|| base.startsWith('__MACOSX')
			|| base.includes('/.');

		return !skipFile;
	};
};

const SEC_TO_MILLISEC = 1e3;
// 100 bytes
const SYNC_FILE_LIMIT = 1e2;

const prepareProductionDeploy = async ({siteData}) => {
	if ((isObject as (x: unknown) => boolean)(siteData.published_deploy) && siteData.published_deploy.locked) {
		log('\n Deployments are "locked" for production context of this site\n');
		exit(0);
	}

	logJson({message: 'Deploying to main site URL...'});
};

const hasErrorMessage = (actual: string, expected: string) => {
	if (typeof actual === 'string') {
		return actual.includes(expected);
	}

	return false;
};

const getJsonErrorMessage = error_ => get(error_, 'json.message', '');

const reportDeployError = ({error_, failAndExit}: {error_: any; failAndExit: typeof error}) => {
	switch (true) {
		case error_.name === 'JSONHTTPError': {
			const message = getJsonErrorMessage(error);

			warn(`JSONHTTPError: ${message} ${error_.status}`);
			warn(`\n${JSON.stringify(error_, null, '  ')}\n`);
			failAndExit(error_ as Error);
			return;
		}

		case error_.name === 'TextHTTPError': {
			warn(`TextHTTPError: ${error_.status}`);
			warn(`\n${error_}\n`);
			failAndExit(error_ as Error);
			return;
		}

		case hasErrorMessage(error_.message as string, 'Invalid filename'): {
			warn(error_.message as string);
			failAndExit(error_ as Error);
			return;
		}

		default: {
			warn(`\n${JSON.stringify(error_, null, '  ')}\n`);
			failAndExit(error_ as Error);
		}
	}
};

const deployProgressCb = function () {
	return (event: {phase: string; msg: string}) => {
		if (event.phase === 'start') {
			logJson({type: 'step:start', step: event.msg});
		}

		if (event.phase === 'error') {
			console.log({type: 'step:error', step: event.msg});
		}
	};
};

const runDeploy = async ({
	deployFolder,
	deployTimeout,
	deployToProduction,
	silent,
	siteData,
	siteId,
	title,
}: {
	deployFolder: string;
	deployTimeout: number;
	deployToProduction: boolean;
	silent: boolean;
	siteData: unknown;
	siteId: string;
	title?: string;
}) => {
	let results: Awaited<ReturnType<typeof deploySite>>;
	let deployId: string | undefined;

	try {
		if (deployToProduction) {
			await prepareProductionDeploy({siteData});
		} else {
			log('Deploying to draft URL...');
		}

		const draft = !deployToProduction;
		const apiResponse = await api.createSiteDeploy({siteId, title, body: {draft}});
		deployId = apiResponse.id;

		results = await deploySite(siteId, deployFolder, {
			statusCb: silent ? () => {} : deployProgressCb(), // eslint-disable-line @typescript-eslint/no-empty-function
			deployTimeout,
			syncFileLimit: SYNC_FILE_LIMIT,
			// Pass an existing deployId to update
			deployId,
			filter: getDeployFilesFilter({deployFolder}),
		});
	} catch (error_: unknown) {
		if (deployId) {
			await cancelDeploy({deployId});
		}

		reportDeployError({error_, failAndExit: error});
		throw error_;
	}

	const siteUrl = results.deploy.ssl_url || results.deploy.url;
	const deployUrl = get(results, 'deploy.deploy_ssl_url', '') ?? get(results, 'deploy.deploy_url', '');
	const logsUrl = `${get(results, 'deploy.admin_url')}/deploys/${get(results, 'deploy.id')}`;

	return {
		siteId: results.deploy.site_id,
		siteName: results.deploy.name,
		deployId: results.deployId,
		siteUrl,
		deployUrl,
		logsUrl,
	};
};

const printResults = ({deployToProduction, results}: {deployToProduction: boolean; results: Record<string, string>}) => {
	// Spacer
	log();

	/* eslint-disable camelcase */
	const jsonData: Record<string, string> = {
		name: results.name,
		site_id: results.site_id,
		site_name: results.siteName,
		deploy_id: results.deployId,
		deploy_url: results.deployUrl,
		logs: results.logsUrl,
	};
	/* eslint-enable camelcase */

	if (deployToProduction) {
		jsonData.url = results.siteUrl;
	}

	logJson(jsonData, true);
	exit(0);
};

export interface NetlifyDeployOptions {
	site: string;
	prod: boolean;
	dir: string;
	title?: string;
	silent?: boolean;
	timeout?: number;
}

export const deploy = async (options: NetlifyDeployOptions) => {
	const siteId = options.site;
	let siteData: SiteData;

	if (siteId) {
		try {
			const response = await api.getSite({siteId})
				.then(data => ({siteFoundById: data}))
				.catch((error_: unknown) => ({siteError: error_}));

			if ('siteError' in response) {
				throw response.siteError;
			}

			siteData = response.siteFoundById;
		} catch (error_: unknown) {
			if (error_ && typeof error_ === 'object') {
				// Netlify(TODO) specifically handle known cases (e.g. no account access)
				if ((error_ as any).status === 404) {
					error('Site not found');
				} else {
					error((error_ as Error).message);
				}
			}

			throw error_;
		}
	} else {
		log('This folder isn\'t linked to a site yet');
		exit(1);
	}

	const deployToProduction = options.prod;
	const deployFolder = options.dir;

	logJson({'Deploy path': deployFolder});

	await validateDeployFolder({deployFolder});

	const results = await runDeploy({
		deployFolder,
		deployTimeout: (options.timeout ?? DEFAULT_DEPLOY_TIMEOUT_SEC) * SEC_TO_MILLISEC,
		deployToProduction,
		silent: options.silent ?? false,
		siteData,
		siteId,
		title: options.title,
	});

	printResults({results, deployToProduction});
};
