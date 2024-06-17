# 0.3.1

 - fix: wrong service list requested after serviceMap update

# 0.3.0

 - [potentially breaking] use built-in (`globalThis.fetch`) fetch
 - feat: allow service bucket reconfiguration
 - narrow return type of `getRequestInfo`. If you're mutating the response, you will need to cast it to `RequestInit`.
 - add some documentation on public methods

# 0.2.0

 - [breaking] move credentials parameter to part of gatewayURL
 - :sparkles: add support for automatically including host in headers

# 0.1.0

 - Initial Release
