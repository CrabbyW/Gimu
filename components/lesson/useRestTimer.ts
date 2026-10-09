import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { now } from '@/lib/clock';
import { extendRest, REST } from '@/logic/lessonFlow';

const TICK_MS = 250;

export interface RestTimer {
  /** Zbývající celé sekundy (zaokrouhleno nahoru). */
  secondsLeft: number;
  /** Celková délka pauzy po prodloužení (pro podíl prstence). */
  total: number;
  /** „+15 s“ ještě jde (strop `REST.maxS`). */
  canExtend: boolean;
  extend(): void;
}

/** Odpočet pauzy mezi cviky (UX pass U1). Počítá se z časové značky začátku, ne sčítáním tiků: zamčený
 *  telefon nebo zaseknuté JS vlákno čas neztratí. Po návratu do popředí se hned přepočítá; v nule zavolá
 *  `onEnd` právě jednou. */
export function useRestTimer(onEnd: () => void, seconds: number = REST.seconds): RestTimer {
  const [startAt] = useState(() => now().getTime());
  const [total, setTotal] = useState(seconds);
  const [left, setLeft] = useState(seconds * 1000);
  const ended = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  const tick = useCallback(() => {
    const ms = Math.max(0, startAt + total * 1000 - now().getTime());
    setLeft(ms);
    if (ms === 0 && !ended.current) { ended.current = true; onEndRef.current(); }
  }, [startAt, total]);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') tick(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [tick]);

  const extend = useCallback(() => { if (!ended.current) setTotal((t) => extendRest(t)); }, []);
  return { secondsLeft: Math.ceil(left / 1000), total, canExtend: total < REST.maxS, extend };
}
