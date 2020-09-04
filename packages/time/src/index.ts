import * as dayjs_ from 'dayjs';
import cpf from 'dayjs/plugin/customParseFormat';

export const dayjs = dayjs_.extend(cpf);
export * as semester from './semester';
export * as tzOffset from './tz-offset';
export {default as unitsToMs} from './units-to-ms';
