import {Transform, TransformCallback} from 'stream';

export class PrefixTransformer extends Transform {
	private readonly _context: string;

	private _previousTransformEndedWithNewLine = true;

	constructor(context: string) {
		super();
		this._context = context;
	}

	_transform(chunk_: string, _encoding: string, callback: TransformCallback): void {
		const chunk = String(chunk_);
		let newChunk = '';
		const chunkLength = chunk.length;

		/**
		* If the previous transform ended with a new line, we didn't output the context.
		* We need to add it now since there is data
		*
		* example:
		*  previous stream:
		*    this is a stream
		*
		*  transformed:
		*    [context] this is a stream
		*
		*  next stream:
		*    more text
		*  final output:
		*    [context] this is a stream
		*    [context] more text
		*/

		if (this._previousTransformEndedWithNewLine) {
			newChunk = `[${this._context}] ${chunk[0]}`;
		}

		this._previousTransformEndedWithNewLine = chunk.endsWith('\n');

		for (let i = 1; i < chunkLength; ++i) {
			// We need to add context after every new line, unless it's the
			// last character of the transformer
			if (chunk[i] === '\n' && i !== chunkLength - 1) {
				newChunk += `\n[${this._context}] `;
			} else {
				newChunk += chunk[i];
			}
		}

		callback(null, newChunk);
	}
}
