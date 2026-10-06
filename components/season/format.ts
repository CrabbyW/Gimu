import { copy } from '@/data/copy';
import { parseISODate } from '@/logic/dates';
import type { ISODate } from '@/types';

/** Desetinná čárka (česky): 2.5 → „2,5“. */
export const decimal = (n: number): string => String(n);

/** „28. 9.“ z ISO data. */
export const shortDate = (iso: ISODate): string => {
  const d = parseISODate(iso);
  return copy.season.dateShort(d.getDate(), d.getMonth() + 1);
};
