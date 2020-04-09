# `@gradebook/course-serializer`

> Utilities to make a course shareable via URLs

## Usage

```js
const serializer = require('@gradebook/course-serializer');

serializer.deserialize(serializedHash);

serializer.serializer(
	serializer.strip(courseFromUserExport)
);

serializer.validate(
	serializer.strip(courseFromUserExport)
);
```
