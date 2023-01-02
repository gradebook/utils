# `@gradebook/logging`

> Pino-based logger partially compatible with Ghost Ignition

For a comparison to Ghost Ignition, check out [./comparison.md](./comparison.md)

## Usage

```ts
// Create a logger with Ignition-like config
import {createLogger} from '@gradebook/logging';

// Note: options are described in the types for now
const logger = createLogger(/* options */);

logger.info('Hello, world!');
logger.error(new Error('Uh, oh!'));

// Automatically log HTTP requests

import express from 'express';
import {useHttpLogging} from '@gradebook/logging/lib/http.js';

const app = express();

// Note: options are described in the types for now
app.use(useHttpLogging(logger, /* options */))
```
