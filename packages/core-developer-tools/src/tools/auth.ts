import type {Application, NextFunction, Request, Response, RequestHandler} from 'express';
import {serverDependencies} from '../server-dependencies.js';
import {appPath} from '../_app-path.js';
import * as query from '../query.js';

const route = '/authentication/begin';

async function getEmails() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const response = await serverDependencies.knex.getKnex().from('users').select('email').orderBy('updated_at', 'desc') as Array<{email: string}>;

	return response.map(({email}) => email);
}

async function getId(email: string/* , table: string | null */): Promise<string | undefined> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const response = await serverDependencies.knex.getKnex()
		.select('id')
		.from('users')
		.where('email', email)
		.first() as undefined | {id: string};

	if (response) {
		return response.id;
	}

	return undefined;
}

const renderEmails = (emails: string[]) => {
	let response = '';

	for (const email of emails) {
		response += `<li class="email"><a href="#">${email}</a></li>`;
	}

	return response;
};

const render = (emails: string[], routeQuery: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Developer Session Chooser</title>
	<style>
		body {
			margin: 0;
			font-family: sans-serif;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-top: 25vh;
		}

		.container {
			margin: 0 auto;
			max-width: 450px;
		}

		p {
			margin: 0;
			font-size: 1.25rem;
		}

		ul {
			padding-left: 1.25rem;
			margin-bottom: 2.5rem;
		}

		.emails {
			display: flex;
			flex-direction: column;
		}

		.email {
			padding: 0.5rem 1rem;
			margin: 0.2rem;
		}

		.email a {
			cursor: pointer;
		}

		.email a:hover {
			color: firebrick;
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<p>Choose an existing account in the database:</p>
		<div class="emails">
			<ul>
				${renderEmails(emails)}
			</ul>
			<a href="${route}${routeQuery}">Use Google Auth</a>

			<form name="selector" method="post" action="/__dev__/auth/session">
				<input type="hidden" name="email" />
			</form>
		</div>
	</div>
	<script>
		const form = document.querySelector('[name="selector"]');
		const email = document.querySelector('input[name="email"]');
		document.querySelectorAll('.email a').forEach(anchor => {
			anchor.addEventListener('click', event => {
				event.preventDefault();
				email.value = event.target.textContent;
				form.submit();
			});
		});
	</script>
</body>
</html>
`;

async function interceptAuth(request: Request, response: Response, next: NextFunction) {
	if (request.query.straightToGoogle) {
		next();
		return;
	}

	const emails = await getEmails();
	const queryParameters = query.getRequestUrl(request).searchParams;
	queryParameters.set('straightToGoogle', 'true');

	response.status(200).send(render(emails, query.getQuery(queryParameters)));
}

async function useEmail(request: Request, response: Response) {
	const table: string | null = null;
	const id = await getId(request.body.email/* , table */);
	if (!id) {
		response.status(500).json({
			error: `Email ${request.body.email} not found`,
		});

		return;
	}

	const session = (request as any).session as {
		passport?: Record<string, any>;
		save: (callback: (error: unknown) => any) => unknown;
	};

	if (session.passport) {
		response.status(500).json({
			error: 'Passport exists in session - this is unexpected',
			passport: session.passport,
		});

		return;
	}

	session.passport = {
		user: `${table}:${id}`,
	};

	session.save(error => {
		if (error) {
			response.status(500).json({
				error: 'Unable to save session',
				saveError: error,
			});

			return;
		}

		response.redirect('/assets/logged-in.html');
	});
}

export async function register(app: Application) {
	const withUser = await serverDependencies.import<{default: RequestHandler}>(
		'./lib/controllers/authentication/with-user.js',
	);

	// @todo: hostmatching
	app.get(route, interceptAuth);
	app.post(
		appPath('/auth/session'),
		withUser.default,
		serverDependencies.express.urlencoded({extended: false}),
		useEmail,
	);
}
