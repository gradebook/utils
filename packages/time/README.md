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

// Get semester in a readable format e.g. "Fall 2020"
const {readableSemester} = require('@gradebook/time');
semester = readableSemester('2020F');
console.log(semester.season + ' ' + semester.year);

const {tzOffset} = require('@gradebook/time');
console.log(tzOffset.getOffset('2d3h4m')); // 2 days, 3 hours, 4 minutes in ms
```
