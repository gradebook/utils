# 0.6.5

 - :bug: [hook] fix failure in sending generic hook

# 0.6.4

 - add fallback mime type
 - upload-asset: set exit code as number of failures

# 0.6.3

 - possibly fix tests

# 0.6.2

 - Fix asset-upload issues with content type

# 0.6.1

 - fix tests

# 0.6.0

 - extract github logic (breaking api change)
 - fix upload-asset failure

# 0.5.2

 - fix tests

# 0.5.1

 - fix build failure

# 0.5.0

 - :sparkles: add publish-github-release recipe
 - :bug: upload-github-release-asest: fix 404 when making GET request
 - upload-github-release-asset: fail when fetch response is not ok

# 0.4.6

 - actually fix request method

# 0.4.5

 - fix request method when publishing a release

# 0.4.4

 - fix release iteration url

# 0.4.3

 - use releases list rather than searching for a specific release

# 0.4.2

 - fix typo

# 0.4.1

 - :bug: fix typo in authorization header

# 0.4.0

 - :sparkles: publish draft release after npm publish succeeds
 - :sparkles: add support for generic webhooks
 - :recycle:  refactor get-sha-from-env to get-{var}-from-env

# 0.3.1

 - add support for :tag: variable in upload-asset recipe

# 0.3.0

 - :sparkles: add upload-asset hook + api

# 0.2.4

 - fix api exports

# 0.2.3

 - rename env vars because the 'with' syntax doesn't work

# 0.2.2

 - update docs url

# 0.2.1

 - Downgrade zx due to node compat issues

# 0.2.0

 - Absorb @gradebook/release utils and add hook recipe based on it

# 0.1.2

 - fix whitespace
 - attempt to fix issues with fetching file diff
 - fix false negative release code

# 0.1.1

 - fix incorrect yarn command being run in test-and-publish

# 0.1.0

 - Initial Release
