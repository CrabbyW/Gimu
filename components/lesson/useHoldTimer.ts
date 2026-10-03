import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { now } from '@/lib/clock';
import { feedback, type FeedbackId } from '@/lib/feedback';

export type HoldStatus = 'ready' | 'countdown' | 'running' | 'paused' | 'done';

export interface HoldTimer {
  status: HoldStatus;
  /** Zbývající celé sekundy (zaokrouhleno nahoru: 29,2 s → 30). */
  secondsLeft: number;
  /** Číslo odpočtu před startem (3, 2, 1) ve stavu `countdown`, jinak 0. */
  countdown: number;
  /** Zbývající zlomek 1 → 0 pro prstenec. */
  progress: SharedValue<number>;
  start(): void;
  pause(): void;
}

const TICK_MS = 250;
const DONE_DELAY_MS = 400;
const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 1000;
const HOLD_TICK_EVERY = 10;
const LAST: Record<number, FeedbackId> = { 5: 'holdLast5', 4: 'holdLast4', 3: 'holdLast3', 2: 'holdLast2', 1: 'holdLast1' };

/** Odpočet výdrže. Počítá se proti hodinám, ne sčítáním tiků, takže zaseknuté JS
 *  vlákno čas neztratí. Při odchodu appky na pozadí se odpočet pauzne.
 *  První start předchází odpočet 3-2-1 (motion spec §2): countdown3/2/1, pak `go` a výdrž běží.
 *  Během výdrže `holdTick` na každé celé desítce, posledních 5 s holdLast5..1 po 1000 ms, v nule `holdDone`. */
export function useHoldTimer(seconds: number, onDone: () => void): HoldTimer {
  const total = seconds * 1000;
  const [status, setStatus] = useState<HoldStatus>('ready');
  const [remainingMs, setRemainingMs] = useState(total);
  const [countdown, setCountdown] = useState(0);
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

  // Akce čtou aktuální stav z refu: vedlejší efekty nepatří do updateru setState (StrictMode ho volá dvakrát).
  const live = useRef({ status, remainingMs });
  useEffect(() => { live.current = { status, remainingMs }; }, [status, remainingMs]);

  // Odpočet 3-2-1: každé číslo jednou, po jedničce `go` a start výdrže proti hodinám.
  useEffect(() => {
    if (status !== 'countdown') return;
    const id = setTimeout(() => {
      if (countdown > 1) { setCountdown(countdown - 1); return; }
      setCountdown(0);
      endAt.current = now().getTime() + live.current.remainingMs;
      live.current = { ...live.current, status: 'running' };
      setStatus('running');
    }, COUNTDOWN_STEP_MS);
    return () => clearTimeout(id);
  }, [status, countdown]);
  useEffect(() => {
    if (status === 'countdown' && countdown > 0) feedback(`countdown${countdown}` as FeedbackId);
  }, [status, countdown]);

  // Haptika výdrže: jednou na každou celou sekundu (ref chrání před opakováním po pokračování z pauzy).
  const lastCue = useRef<number | null>(null);
  useEffect(() => {
    if (status !== 'running') return;
    if (lastCue.current === null) { lastCue.current = secondsLeft; feedback('go'); return; }
    if (lastCue.current === secondsLeft) return;
    lastCue.current = secondsLeft;
    const last = LAST[secondsLeft];
    if (last) feedback(last);
    else if (secondsLeft > 0 && secondsLeft % HOLD_TICK_EVERY === 0) feedback('holdTick');
  }, [status, secondsLeft]);

  useEffect(() => {
    if (status !== 'done') return;
    feedback('holdDone');
    const id = setTimeout(() => onDoneRef.current(), DONE_DELAY_MS);
    return () => clearTimeout(id);
  }, [status]);


  const start = useCallback(() => {
    const { status: s, remainingMs: left } = live.current;
    if (s !== 'ready' && s !== 'paused') return;
    if (s === 'ready') {
      live.current = { status: 'countdown', remainingMs: left };
      setCountdown(COUNTDOWN_FROM);
      setStatus('countdown');
      return;
    }
    endAt.current = now().getTime() + left;
    live.current = { status: 'running', remainingMs: left };
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    // Pauza během odpočtu vrací na začátek: výdrž ještě neběžela.
    if (live.current.status === 'countdown') {
      live.current = { ...live.current, status: 'ready' };
      setCountdown(0);
      setStatus('ready');
      return;
    }
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

  return { status, secondsLeft, countdown, progress, start, pause };
}
