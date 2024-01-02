# `@gradebook/trusted-request`

> Express middleware to limit requests to trusted IPs

## Usage

```js
import express from 'express';
import {allowTrustedIps} from '@gradebook/trusted-request';

const onlyTrustedIps = allowTrustedIps({
	trustProxy: true,
	trustedIps: ['127.0.0.1', '192.168.124.131'] // Only allow requests from loopback and (e.g.) the parent node
});

const app = express();

app.use('/api', apiRouter);
// trusted-request DOES NOT handle authentication or authorization
app.use('/admin', onlyTrustedIps, user.isAuthenticated, adminRouter);
```

## API Reference

```ts
import {allowTrustedIps, TrustedRequestError} from '@gradebook/trusted-request';
```

If a request is not trusted, `trustedRequest` will call `next(new TrustedRequestError)`.
