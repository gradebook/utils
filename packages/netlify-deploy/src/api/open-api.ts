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

export type NetlifyCreateSiteDeployPayload = {
	draft: boolean;
};

export type NetlifyUpdateSiteDeployPayload = {
	async: boolean;
	draft: boolean;
};
