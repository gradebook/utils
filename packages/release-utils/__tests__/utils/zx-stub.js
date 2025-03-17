import {wrapTaggedTemplateLiteral} from './wrap-tagged-template-literal.js';

export function createZxStub({
	tag,
	fileList = ['packages/test/package.json'],
	// Gradebook Utils
	revList = ['a24b0be2e512cdf5e1db4fcf31c433563a023b3e', 'd84c29d3669216617dae904ad388fa5721a4864d'],
}) {
	return wrapTaggedTemplateLiteral(command => {
		if (command.startsWith('git rev-list')) {
			return {
				exitCode: 0,
				stdout: revList.join(' '),
			};
		}

		if (command.startsWith('git log')) {
			return {
				exitCode: 0,
				stdout: fileList.join('\n'),
			};
		}

		if (command.startsWith('git tag')) {
			const stdout = typeof tag === 'function' ? tag(command) : tag;
			return {
				exitCode: 0,
				stdout,
			};
		}

		if (command.startsWith('yarn publish')) {
			return {};
		}

		throw new Error(`unknown command run: ${command}`);
	});
}
