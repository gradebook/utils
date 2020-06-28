# @gradebook/utils

Random utilities used by Gradebook

## Project Structure

These utilities are tiny convenience packages used throughout Gradebook. As such, we use [Lerna](https://lerna.js.org) to manage each package. All packages are located in the [packages](https://github.com/gradebook/cli-utils/tree/master/packages) directory. Our package manager of choice is [Yarn](https://yarn.pm), and we use Yarn Workspaces in conjunction with Lerna.

The core of each package is written in TypeScript, while tests are written in javascript, with type-checking enabled. While TypeScript is our preferred language, the compilation can be time-consuming, and messes with the stack-trace of the file that's being edited. Thus, the compromise is to use TS in the core code, and JS in test code.

Each package has common code-quality scripts:

- `test` to run the tests (located in the `__tests__` folder)
- `test:coverage` to run tests with test coverage enabled. We don't have CI coverage enabled at the moment

The code for each package is written in the `src` folder, and compiled to the `lib` folder

## Compiling for multiple Module Types (targets)

As we are unable to exclusively use ES Modules until at least Node 14.x (becomes LTS), some packages will require compilation to multiple module types.

The standard module type is CommonJS. The `tsconfig.json` file in each package should compile to that.

### Adding additional compilation targets

1. Add the additional typescript configurations with the filename `tsconfig.{type}.json`

	 - In each tsconfig, the output folder should be `lib/{target}` - e.g. `lib/commonjs` or `lib/module`

1. Ensure the `main` and `module` keys exist in `package.json`. Main should reference CommonJS and

1. Update the `prepublish` script to run `../../scripts/compile-all.js`

1. Add the `targets` property to `package.json` with a list of *additional* tsconfig projects

	- If you want to compile to CommonJS and ESModule, the value would be `["module"]` assuming the secondary config file is `tsconfig.module.json` - the `compile-all.js` will run tsc using `tsconfig.json` and `tsconfig.module.json`