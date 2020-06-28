# `@gradebook/external-window`

> Promisify `window.open`

## Usage

```js
const {ExternalWindowService: ExternalWindow} = require('@gradebook/external-window');

// Opens a new window centered on the screen
const externalWindow = new ExternalWindow('https://my.authentication', 'Log in to your account');

// Very naive implementation!
/** @type {HTMLButtonElement} */
myButton.addEventListener('click', () => {
	externalWindow.requestFocus();
});

externalWindow.promise.then(fetchUserSession);
```
