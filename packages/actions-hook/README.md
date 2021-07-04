# `actions-hook`

# DEPRECATED

**This package is deprecated in favor of @gradebook/release-utils**

The updated path is:
```js
// yarn add --dev @gradebook/release-utils
const actionsHook = require('@gradebook/release-utils/api/actions-hook.js');
```

Also refer to [@gradebook/release-utils](https://github.com/gradebook/utils/tree/master/packages/release-utils) ([npm](https://npmjs.com/package/@gradebook/release-utils))

## Archived Documentation

> Ping a webhook when Github Actions successfully runs

## Usage

```js
const actionsHook = require('@gradebook/actions-hook');

actionsHook.sendPayload({
	// url: process.env.WEBHOOK_URL by default
	// secret: process.env.WEBHOOK_SECRET by default
	// log: console.log by default
	payload: {sha}, // required - can be string, JSON object or something with a `toString` property
	onlyIf: { // optional, allows you to specify the branch, repository, and if it was a push event
		branch: 'master',
		isPush: false
	}
}).catch(error => {
	console.log('Failed sending payload', error.message);
	process.exit(1);
});
```
