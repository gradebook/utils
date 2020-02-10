# Together

> Run multiple processes in a terminal

## Usage

```js
const Together = require('@gradebook/together');

// Launch your frontend and backend watch tasks simultaneously:
// The output will be piped directly to stdio.
const spawnedProcesses = new Together([
	['Run the frontend', 'yarn frontend:watch'],
	['Run the backend', 'yarn backend:watch']
]);

// No need to add handlers for SIGTERM or SIGINT, it's done automatically!
// If you need to manually shut a process group down, you can:
spawnedProcesses.shutdown();

// If you spawned multiple process groups, you can clean them all up:
Together.cleanup();
```
