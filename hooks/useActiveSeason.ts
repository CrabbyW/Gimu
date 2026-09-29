import { now } from '@/lib/clock';
import { services } from '@/services';
import { useServiceQuery } from './useServiceQuery';

export const useActiveSeason = () => useServiceQuery(() => services.season.getActive(now()), []);
