# `@gradebook/service-auth`

> Service Authentication made simple

Service Auth is authentication middleware designed for service:service authentication.

## Example

Service A wants to communicate with Service B, but Service B doesn't want to roll it's own authentication system.

Service B can delegate a central service (such as an Authentication Gateway) to manage broad-level permissions (e.g.
Service A has permission to communicate with Service B and Service D, but not Service C), and use this library to ensure
Service A is allowed to access Service B (at the macro level).

### Flow

1. Authentication Gateway is configured to allow Service A to communicate with Service B
1. Service A proves itself to Authentication Gateway, and asks for a token granting access to Service B
1. Authentication Gateway provides a JWT (signed with its private key) to Service A
1. Service A makes a request to Service B including the JWT in the `Authorization` header
1. Service B validates the JWT in the request against Authentication Gateway's public key (which is exposed at
`./.well-known/jwks.json` in [rfc7517](https://datatracker.ietf.org/doc/html/rfc7517) format)
1. If needed, Service B confirms Service A has the required granular permissions

@gradebook/service-auth handles step 5, and @gradebook/client-auth handles step 2

## Usage

```js
const express = require('express');
const {useServiceAuth} = require('@gradebook/service-auth');

const app = express();

app.use(useServiceAuth({
	// JWKS is fetched using jose. If you want to use your own
	// key manager, you can pass the `store` option instead
	// of `gatewayRoot`. `store` should follow the same API as
	// jose.createRemoteJWKSet().
	gatewayRoot: 'https://auth.internal/',
	serviceName: 'your-awesome-service',
}));

app.get('/api/v0/whoami', (request, response) => {
	response.json(request.gateway /* {integration: integration_id} */);
});
```
