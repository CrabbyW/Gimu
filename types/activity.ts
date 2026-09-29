import type { ISODate } from './common';

export interface ActivityEvent {
  id: string;
  /** ISO datetime vzniku (UTC řetězec z Date#toISOString). */
  at: string;
  /** Místní kalendářní den, ke kterému se aktivita počítá. Ukládá se při zápisu, aby změna časové zóny nepřepisovala historii. */
  day: ISODate;
  lessonId: string;
  xp: number;
  /** Den sezóny opravený touto aktivitou (comeback, plán B). */
  repairsDate?: ISODate;
}
