import dayjs from 'dayjs';
import cpf from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(cpf);

export * as semester from './semester-calendar.js';
export * as tzOffset from './tz-offset.js';
export * as Semester from './semester.js';
export {default as unitsToMs} from './units-to-ms.js';

export {default as dayjs} from 'dayjs';
