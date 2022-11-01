
declare module 'through2-filter' {
	import type {Through2Constructor} from 'through2';

	type FilterCallback = (chunk: any, index: number) => void;
	const defaultExport: (callback: FilterCallback) => Through2Constructor;
	export const objCtor: typeof defaultExport; // eslint-disable-line unicorn/prevent-abbreviations
	export default defaultExport;
}
