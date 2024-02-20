import type {Export} from './shared/interfaces.js';

interface ExportOptions {
	school: string;
	hostname?: string;
	secure?: boolean;
	userId: string;
}

export async function getExport(
	{school, userId, hostname = 'gradebook.app', secure = false}: ExportOptions,
): Promise<Export> {
	const url = `http${secure ? 's' : ''}://${hostname}/api/v0/internal/raw-user-export?user=${userId}&school=${school}`;
	const request = await fetch(url);

	if (!request.ok) {
		throw new Error(`Request failed: ${request.status} ${request.statusText}`);
	}

	return request.json() as Promise<Export>;
}
