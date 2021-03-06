import {wrapTaggedTemplateLiteral} from './wrap-tagged-template-literal.js';

export function createZxStub({tag, fileList = ['packages/test/package.json']}) {
	return wrapTaggedTemplateLiteral(command => {
		if (command.startsWith('git log')) {
			return {
				stdout: fileList.join('\n'),
			};
		}

		if (command.startsWith('git tag')) {
			return {
				stdout: tag,
			};
		}

		if (command.startsWith('yarn publish')) {
			return {};
		}

		throw new Error(`unknown command run: ${command}`);
	});
}
