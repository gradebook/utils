# `@gradebook/core-developer-tools`

## Usage

```js
// gradebook/server developer.js
module.exports.developerLogic = app => {
	const coreDeveloperTools = require('@gradebook/core-developer-tools');
	coreDeveloperTools.load(__dirname, app);

	// Add your own logic here
};
```

## Why does this package exist?

To aid in development, we have several in-house developer tools. This includes basic things like:
 - asset routing with a local front-end
 - live reloading
 - request delays

We also have more complex use-cases such as bypassing login screens or overriding existing settings.

These complex use cases have security implications, which is why this package exists.

In the server:

1. Developer Tools are not loaded unless the `enableDeveloperExperiments` flag is enabled

1. Developer Tools fail to load in production environments

1. The more complex tools are bundled in this module

   1. It's a development dependency, which means it won't be installed in production

   1. This module does _another_ production check before bootstrapping

1. Developers have to create a `developer.js` file in the server project which loads this module

As you can see, there are several safe-guards in place to make sure these features are not exposed in a production environment.
