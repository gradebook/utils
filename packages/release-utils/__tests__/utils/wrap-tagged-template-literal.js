/**
 * @param {(response: string) => any} actualLogic
 */
export function wrapTaggedTemplateLiteral(actualLogic) {
	/**
	 * @param {string[]} strings
	 * @param {string[]} variables
	 */
	return (strings, ...variables) => {
		let response = '';

		for (const [index, string] of strings.entries()) {
			response += string;
			if (index < strings.length - 1) {
				response += variables[index];
			}
		}

		return actualLogic(response);
	};
}
