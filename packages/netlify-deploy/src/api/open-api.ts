export interface NetlifySite {
	id: string;
	state: string;
}

export interface NetlifySiteDeploy {
	id: string;
	site_id: string;
	name: string;
	state: string;
	required: string[];
	url: string;
	ssl_url: string;
}

export interface NetlifyUploadFile {
	id: string;
	path: string;
	sha: string;
	mime_type: string;
	size: number;
}

export type NetlifyCreateSiteDeployPayload = { // eslint-disable-line @typescript-eslint/consistent-type-definitions
	draft: boolean;
};

export type NetlifyUpdateSiteDeployPayload = { // eslint-disable-line @typescript-eslint/consistent-type-definitions
	async: boolean;
	draft: boolean;
};
