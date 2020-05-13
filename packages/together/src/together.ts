// @NOTE: we're not using concurrently because it can't handle readline (I think), so we lose support
// for build progress

import execa = require('execa');
import {PrefixTransformer} from './prefix-transformer';

let cleanupScheduled = false;
let id = 0;

const instances: Together[] = [];

export function cleanup(): void {
	for (const instance of instances) {
		instance.shutdown();
	}
}

interface SpawnedProcess {
	name: string;
	child: execa.ExecaChildProcess;
}

export type Command = [string, string, execa.Options?];
export class Together {
	public readonly id: number;

	private readonly _children: SpawnedProcess[] = [];

	private _terminated = false;

	constructor(commands: Command[]) {
		instances.push(this);
		this.id = id++;

		if (!cleanupScheduled) {
			process.on('SIGINT', cleanup);
			process.on('SIGTERM', cleanup);
			cleanupScheduled = true;
		}

		for (const [name, command, options = {}] of commands) {
			const stdoutStream = new PrefixTransformer(name);
			const stderrStream = new PrefixTransformer(name);
			const child = execa.command(command, Object.assign(options));
			child.stdout.pipe(stdoutStream).pipe(process.stdout);
			child.stderr.pipe(stderrStream).pipe(process.stderr);
			process.stdin.pipe(child.stdin);
			this._children.push({name, child});
		}
	}

	shutdown(): void {
		if (this._terminated) {
			return;
		}

		this._terminated = true;

		for (const {name, child} of this._children) {
			console.log('Killing', name);
			child.cancel();
		}
	}
}

export default Together;
