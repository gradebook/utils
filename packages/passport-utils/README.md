# `@gradebook/passport-utils`

> Abstractions for auth integration with Google using passport. Centered around Gradebook

## Usage

```javascript
// @ts-check
const {createProfileHandler, createUserDeserializer, serializeUser} = require('@gradebook/passport-utils');
const passport = require('passport');
const Strategy = require('passport-google-oauth20');

const handleProfile = createProfileHandler(gid => api.findUserFromGid(gid));

function setupPassport() {
	passport.use(new Strategy({clientID, clientSecret, callbackURL, passReqToCallback: true}, handleProfile));
	passport.serializeUser(serializeUser);
	passport.deserializeUser(createUserDeserializer((id, table) => api.findUser(id, table), 'my.domain'));
}
```
