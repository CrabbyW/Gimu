import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { now } from '@/lib/clock';
import { feedback } from '@/lib/feedback';
import { restFlow } from '@/lib/motion';
import { extendRest, REST } from '@/logic/lessonFlow';

const TICK_MS = 250;

export interface RestTimer {
  /** Zbývající celé sekundy (zaokrouhleno nahoru). */
  secondsLeft: number;
  /** Celková délka pauzy po prodloužení (pro podíl prstence). */
  total: number;
  /** Podíl zbývajícího času 0–1 z ms (prstenec ubývá plynule, ne po celých sekundách). */
  progress: number;
  /** „+15 s“ ještě jde (strop `REST.maxS`). */
  canExtend: boolean;
  extend(): void;
}

/** Která sekunda se má teď ohlásit tikem (posledních `fromS` s, každá nejvýš jednou): `null` = nic.
 *  `lastCued` = naposledy ohlášená sekunda. Po návratu ze zámku se ohlásí jen aktuální sekunda, ne zmeškané. */
export function restCue(msLeft: number, lastCued: number | null, fromS: number = restFlow.cueFromS): number | null {
  if (msLeft <= 0) return null;
  const sec = Math.ceil(msLeft / 1000);
  return sec <= fromS && sec !== lastCued ? sec : null;
}

/** Odpočet pauzy mezi cviky (UX pass U1). Počítá se z časové značky začátku, ne sčítáním tiků: zamčený
 *  telefon nebo zaseknuté JS vlákno čas neztratí. Po návratu do popředí se hned přepočítá; v nule zavolá
 *  `onEnd` právě jednou. */
export function useRestTimer(onEnd: () => void, seconds: number = REST.seconds): RestTimer {
  const [startAt] = useState(() => now().getTime());
  const [total, setTotal] = useState(seconds);
  const [left, setLeft] = useState(seconds * 1000);
  const ended = useRef(false);
  const cued = useRef<number | null>(null);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  const tick = useCallback(() => {
    const ms = Math.max(0, startAt + total * 1000 - now().getTime());
    setLeft(ms);
    if (ended.current) return;
    const cue = restCue(ms, cued.current);
    if (cue !== null) { cued.current = cue; feedback('restTick'); }
    // Konec jen jednou (i po zamčení); výraznější úder jen při přirozeném doběhnutí, [SKIP REST] má vlastní stisk.
    if (ms === 0) { ended.current = true; feedback('restEnd'); onEndRef.current(); }
  }, [startAt, total]);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') tick(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [tick]);

  const extend = useCallback(() => { if (!ended.current) { feedback('restExtend'); setTotal((t) => extendRest(t)); } }, []);
  return { secondsLeft: Math.ceil(left / 1000), total, progress: total > 0 ? Math.min(1, left / (total * 1000)) : 0, canExtend: total < REST.maxS, extend };
}
