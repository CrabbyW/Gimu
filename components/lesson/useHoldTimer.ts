import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { now } from '@/lib/clock';
import { haptics } from '@/lib/haptics';

export type HoldStatus = 'ready' | 'running' | 'paused' | 'done';

export interface HoldTimer {
  status: HoldStatus;
  /** Zbývající celé sekundy (zaokrouhleno nahoru: 29,2 s → 30). */
  secondsLeft: number;
  /** Zbývající zlomek 1 → 0 pro prstenec. */
  progress: SharedValue<number>;
  start(): void;
  pause(): void;
}

const TICK_MS = 250;
const DONE_DELAY_MS = 400;
const PULSE_FROM = 3;

/** Odpočet výdrže. Počítá se proti hodinám, ne sčítáním tiků, takže zaseknuté JS
 *  vlákno čas neztratí. Při odchodu appky na pozadí se odpočet pauzne. */
export function useHoldTimer(seconds: number, onDone: () => void): HoldTimer {
  const total = seconds * 1000;
  const [status, setStatus] = useState<HoldStatus>('ready');
  const [remainingMs, setRemainingMs] = useState(total);
  const progress = useSharedValue(1);
  const endAt = useRef(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  const secondsLeft = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      const left = Math.max(0, endAt.current - now().getTime());
      setRemainingMs(left);
      progress.set(withTiming(left / total, { duration: TICK_MS, easing: Easing.linear }));
      if (left === 0) setStatus('done');
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status, total, progress]);

  // Tik v posledních třech sekundách, jednou za každou změnu čísla.
  useEffect(() => {
    if (status === 'running' && secondsLeft > 0 && secondsLeft <= PULSE_FROM) haptics.tick();
  }, [status, secondsLeft]);

  useEffect(() => {
    if (status !== 'done') return;
    haptics.holdDone();
    const id = setTimeout(() => onDoneRef.current(), DONE_DELAY_MS);
    return () => clearTimeout(id);
  }, [status]);

  // Akce čtou aktuální stav z refu: vedlejší efekty nepatří do updateru setState (StrictMode ho volá dvakrát).
  const live = useRef({ status, remainingMs });
  useEffect(() => { live.current = { status, remainingMs }; }, [status, remainingMs]);

  const start = useCallback(() => {
    const { status: s, remainingMs: left } = live.current;
    if (s !== 'ready' && s !== 'paused') return;
    endAt.current = now().getTime() + left;
    live.current = { status: 'running', remainingMs: left };
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    if (live.current.status !== 'running') return;
    const left = Math.max(0, endAt.current - now().getTime());
    live.current = { status: 'paused', remainingMs: left };
    setRemainingMs(left);
    progress.set(left / total);
    setStatus('paused');
  }, [progress, total]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => { if (next !== 'active') pause(); });
    return () => sub.remove();
  }, [pause]);

  return { status, secondsLeft, progress, start, pause };
}
