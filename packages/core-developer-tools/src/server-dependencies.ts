import path from 'path';
import type ExpressDependency from 'express';

interface Log {
	info: typeof console['info'];
	warn: typeof console['warn'];
	error: typeof console['error'];
}

export class ServerDependencies {
	public knex: any;
	public express!: typeof ExpressDependency;
	public middleware!: Record<string, ExpressDependency.Handler>;
	public logging!: Log;

	private serverRoot!: string;

	async init(serverRoot: string) {
		this.serverRoot = serverRoot;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.knex = await this.import<any>('./lib/database/knex.js');
		this.express = await this.import<typeof ExpressDependency>('node_modules/express/index.js');
		this.middleware = await this.import<typeof this['middleware']>('./lib/controllers/middleware.js');
		this.logging = await this.import<{logging: Log}>('./lib/logging.js').then(({logging}) => logging);
	}

	async import<T>(serverRelativePath: string): Promise<T> {
		const absolutePath = path.resolve(this.serverRoot, serverRelativePath);

		return import(absolutePath) as Promise<T>;
	}
}

export const serverDependencies = new ServerDependencies();
