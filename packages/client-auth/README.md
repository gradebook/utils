# `@gradebook/client-auth`

> Authorization management for service:service authentication using a centralized gateway

See [@gradebook/service-auth](https://github.com/gradebook/utils/tree/master/packages/service-auth)

## Usage

```ts
const {AuthManager} = require('@gradebook/client-auth');

const manager = new AuthManager(
	'https://client_id:client_secret@auth.internal/', // Gateway with credentials
	// "buckets" of services that can be used together. This is done to reduce the number of tokens
	// requested from Gateway. e.g. when I talk to Service B, I usually also talk to Service A.
	// This can be as complicated or as simple as you want, but it should include every service
	// the client will use the AuthManager to communicate with
	[
		['group_0_service_a', 'group_0_service_b'],
		['group_1_service_c', 'group_1_service_b'],
	]
);


// Make a request

// The getRequestInfo method is the primary method that will be used. It handles creating a valid JWT and resolving
// the service information.
// Endpoints: POST `${gatewayRoot}/api/v0/token`
//            GET `${gatewayRoot}/api/v0/resolve/:service_name
const [{ip, port, hostname}, fetchOptions] = await manager.getRequestInfo('group_0_service_a');
// We can use `${ip}:${port}` because includeHostInHeader defaults to true - meaning a `host` header is sent along with
// the auth token.
const url = new URL(`${ip}:${port}/api/v0/do-something`/*, {includeHostInHeader: true} */});

const response = await fetch(url.href, fetchOptions).catch(error => {
	// Example: service_a moves to another server. This removes the resolution from the cache
	manager.serviceFailedConnecting('group_0_service_a');
});
```
