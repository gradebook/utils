# `@gradebook/time`

> Make time-based work fun again

## Usage

```js
// dayjs proxy w/ customParseFormat plugin
// docs: http://day.js.org/
const {dayjs: date} = require('@gradebook/time');
console.log(date.daysInMonth());

// Get the active semester (YYYY{Season})
const {semester} = require('@gradebook/time');
console.log(semester.data.activeSemester);

const {tzOffset} = require('@gradebook/time');
console.log(tzOffset.getOffset('2d3h4m')); // 2 days, 3 hours, 4 minutes in ms
```
