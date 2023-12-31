import {type Request, type Application, type Response, type Handler} from 'express';
import {serverDependencies} from '../server-dependencies.js';

declare class UserModelClass {
	constructor(state: Record<string, unknown>);
	set(key: string, value: string): void;
	get(key: string): unknown;
	commit(transaction: any, db: string | null): Promise<unknown>;
}

let UserModel: typeof UserModelClass;

async function clearGpa(request: Request, response: Response) {
	const userObject = Object.assign({}, (request as unknown as {user: Record<string, unknown>}).user);
	const user = new UserModel(userObject);
	const settings = JSON.parse(user.get('settings') as string) as Record<string, unknown>;
	delete settings.overallCredits;
	delete settings.overallGpa;
	delete settings.gpaSemester;

	user.set('settings', JSON.stringify(settings));
	await user.commit(null, (request as unknown as {_table: string | null})._table);
	response.status(204);
	response.end();
}

export async function register(app: Application) {
	const [
		models,
		{withUser},
	] = await Promise.all([
		serverDependencies.import<{user: {UserRow: typeof UserModelClass}}>('./lib/models/index.js'),
		serverDependencies.import<{withUser: Handler}>('./lib/controllers/authentication/with-user.js'),
	]);

	UserModel = models.user.UserRow;

	const route = (path: string) => `/api/v0/__dev__/${path.replace(/^\//, '')}`;
	const MINIMAL_AUTH_MIDDLEWARE = [
		serverDependencies.middleware.hostMatching,
		withUser,
		serverDependencies.middleware.requireAuth,
	];

	app.post(route('clear-gpa'), ...MINIMAL_AUTH_MIDDLEWARE, clearGpa);
}
