import { useEffect, useState } from 'react';
import { fitnessTest } from '@/lib/motion';

/** Celé sekundy mezi časovými značkami, ořezané do 0–max. Čas vždy z `Date.now()`, nikdy ze sčítání tiků. */
export const stopwatchSeconds = (from: number, to: number, max: number) => Math.min(max, Math.max(0, Math.floor((to - from) / 1000)));

/** Podíl prstence stopek 0–1: kolo za `fitnessTest.ringLapS`; celá minuta = plný prstenec (ne prázdný). */
export const plankRingProgress = (secs: number) => {
  if (secs <= 0) return 0;
  const r = (secs % fitnessTest.ringLapS) / fitnessTest.ringLapS;
  return r === 0 ? 1 : r;
};

/** Stopky z časových značek (`Date.now()` při startu), ne ze sčítání tiků: po zamčení telefonu nebo návratu
 *  do appky ukážou skutečně uběhlý čas. Interval jen překresluje, strop `max` sekund. */
export function useStopwatch(max: number) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const running = startedAt != null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  return {
    running,
    elapsed: startedAt != null ? stopwatchSeconds(startedAt, now, max) : 0,
    start: () => { const t0 = Date.now(); setStartedAt(t0); setNow(t0); },
    stop: () => { const s = startedAt != null ? stopwatchSeconds(startedAt, Date.now(), max) : 0; setStartedAt(null); return s; },
  };
}
