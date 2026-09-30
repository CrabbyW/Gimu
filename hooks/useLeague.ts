import { now } from '@/lib/clock';
import { weekStart } from '@/logic/dates';
import { services } from '@/services';
import { useServiceQuery } from './useServiceQuery';

/** Aktuální týden ligy. Při prvním načtení v novém týdnu služba vyhodnotí ten minulý (settleLeague). */
export const useLeague = () => useServiceQuery(() => services.league.getCurrentWeek(now()), [weekStart(now())]);
