# `@gradebook/app-core`

> Config and Logging provider for Applications

## Usage

```ts
import {logger, config} from '@gradebook/app-core';

// `config` is an instance of `@gradebook/config`
logger.info(config.get('env'));

// Instance of `@gradebook/logging` - logging config comes via `config.get('logging')`
logger.info('Hello, world!');

// With express
import express from 'express';
// HTTP-related logic is not included in the default export by design
import {useLoggingAndHealthcheck} from '@gradebook/app-core/lib/healthcheck.js';
const app = express();

// Will error if healthcheck is disabled in logging config
// Mounts healthcheck endpoint and adds HTTP request logging to the app
useLoggingAndHealthcheck(app);
```
