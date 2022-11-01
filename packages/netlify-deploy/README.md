# `@gradebook/netlify-deploy`

> `netlify deploy` but more lightweight, and with less features! Designed to be used in CI

## Removed Flags

- alias/branch
- prodIfUnlocked
- trigger
- build/context
- open

## Removed Features

- Any kind of config resolutions
- auth - token must be provided as an environment variable
- site-by-name - id must be provided via an environment variable
  - create/link site is also removed
- deploy unlocking
- Support for any kind of functions
