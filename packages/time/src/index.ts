import dayjs_ from 'dayjs';
import cpf from 'dayjs/plugin/customParseFormat';

dayjs_.extend(cpf);

export const dayjs = dayjs_;
export * as semester from './semester';
export * as tzOffset from './tz-offset';
export {default as unitsToMs} from './units-to-ms';
