import dayjs from 'dayjs/esm/index.js';
import cpf from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(cpf);

export * as semester from './calendar.js';
export * as tzOffset from './tz-offset.js';
export {default as unitsToMs} from './units-to-ms.js';

export {default as dayjs} from 'dayjs/esm/index.js';
