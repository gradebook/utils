# 0.2.1

 - add sanity tests

# 0.2.0

 - Switch to ESM
   - Remove default export in favor of named (`allowTrustedIps`) export
 - Fix capitalization in config keys - remove successive uppercase characters from acronyms (`IP` -> `Ip`)
 - Improve TrustedRequestError
   - Allow configuring the error message
   - Include request IP in error context
