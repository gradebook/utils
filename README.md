# @gradebook/utils

Random utilities used by Gradebook

## Project Structure

These utilities are tiny convenience packages used throughout Gradebook. As such, we use [Lerna](https://lerna.js.org) to manage each package. All packages are located in the [packages](https://github.com/gradebook/cli-utils/tree/master/packages) directory. Our package manager of choice is [Yarn](https://yarn.pm), and we use Yarn Workspaces in conjunction with Lerna.

The core of each package is written in TypeScript, while tests are written in javascript, with type-checking enabled. While TypeScript is our preferred language, the compilation can be time-consuming, and messes with the stack-trace of the file that's being edited. Thus, the compromise is to use TS in the core code, and JS in test code.

Each package has common code-quality scripts:

- `test` to run the tests (located in the `__tests__` folder)
- `test:coverage` to run tests with test coverage enabled. We don't have CI coverage enabled at the moment
- `lint` to run `xo`, our linter of choice. We don't have lint set up for TypeScript at the moment

The code for each package is written in the `src` folder, and compiled to the `lib` folder