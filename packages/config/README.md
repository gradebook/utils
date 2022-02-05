# `@gradebook/config`

> Opinionated config loader for nconf. Based on @tryghost/config

## Usage

```js
import {getConfig, coerceKeyToBoolean, coerceToBoolean} from '@gradebook/config'

export const config = await getConfig(/* environmentOverride */);

// Works just like nconf
console.log(config.get('env')); // 'development' if no overrides are set

// Also supports forcing boolean types
coerceKeyToBoolean(config, 'featureFlag:feature');
// Which is really just
config.set('featureFlag:feature', coerceToBoolean(config.get('featureFlag:feature')));

// true | false (boolean)
console.log(config.get('featureFlag:feature'));
```

## Configuration

The config loader looks for 2 files - `config.example.json` (defaults), and `config.{env}.json` (env).

- If you provide the `GB_CONFIG_ROOT` env variable, the config loader will look for the `default` and `env` configs in this folder.
- If there is no `GB_CONFIG_ROOT`, the config loader will walk up `process.cwd()` until it finds a defaults file.

- The env is picked from (in order):
	1. The `environmentOverride` param from the `getConfig` call
	1. process.env.NODE_ENV
	1. `development` (default)

## Typing

Since the config is not validated, there is no guarantee that a specific key will exist / be the expected type.
