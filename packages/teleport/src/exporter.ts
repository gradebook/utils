import {URL} from 'url';
import got from 'got';
import type {Export} from './shared/interfaces.js';

interface ExportOptions {
	school: string;
	hostname?: string;
	secure?: boolean;
	userId: string;
}

// @todo: Add client authentication
export async function getExport(
	{school, userId, hostname = 'gradebook.app', secure = false}: ExportOptions,
): Promise<Export> {
	const user: Export = await got.get(
		new URL(`/api/v0/internal/user-dump?user=${userId}&school=${school}`, `http${secure ? 's' : ''}://${hostname}`),
	).json();

	return user;
}
