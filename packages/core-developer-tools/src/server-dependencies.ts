import path from 'path';
import type ExpressDependency from 'express';

export class ServerDependencies {
	public knex: any;
	public express: typeof ExpressDependency;
	public middleware: Record<string, ExpressDependency.Handler>;

	private serverRoot: string;

	async init(serverRoot: string) {
		this.serverRoot = serverRoot;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.knex = await this.import<any>('./lib/database/knex.js');
		this.express = await this.import<typeof ExpressDependency>('node_modules/express/index.js');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		this.middleware = await this.import<any>('./lib/controllers/middleware.js');
	}

	async import<T>(serverRelativePath: string): Promise<T> {
		const absolutePath = path.resolve(this.serverRoot, serverRelativePath);

		return import(absolutePath) as Promise<T>;
	}
}

export const serverDependencies = new ServerDependencies();
