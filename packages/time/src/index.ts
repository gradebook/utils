import dayjs from 'dayjs';
import cpf from 'dayjs/plugin/customParseFormat';

dayjs.extend(cpf);

export * as semester from './semester.js';
export * as tzOffset from './tz-offset.js';
export {default as unitsToMs} from './units-to-ms.js';

export {default as dayjs} from 'dayjs';
