# `actions-hook`

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
