# `@gradebook/trusted-request`

> Express middleware to limit requests to trusted IPs

## Usage

```js
const express = require('express');
// trusted-request is an es-module so if you're using commonJS, you need to use `.default` for the middleware
const trustedRequest = require('@gradebook/trusted-request').default;

const onlyTrustedIPs = trustedRequest({
	trustProxy: true,
	trustedIPs: ['127.0.0.1', '192.168.124.131'] // Only allow requests from loopback and (e.g.) the parent node
});

const app = express();

app.use('/api', apiRouter);
// trusted-request DOES NOT handle authentication or authorization
app.use('/admin', onlyTrustedIPs, user.isAuthenticated, adminRouter);
```

## API Reference

```ts
import trustedRequest, {TrustedRequestError} from '@gradebook/trusted-request';
```

If a request is not trusted, `trustedRequest` will call `next(new TrustedRequestError)`.