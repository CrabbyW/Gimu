import { useEffect, useRef, useState } from 'react';
import { motion, useMotionSafe } from '@/lib/motion';
import { busyLeft, canIdle, nextIdlePause, pickIdleAction, type IdleActionId, type IdleContext, type Rng } from '@/logic/mascotIdle';
import type { MascotIdle, MascotReaction } from './types';

const CFG = motion.mascotIdle;

/**
 * Plánovač života v klidu: jeden JS časovač na pauzu 4–12 s (pódium kratší), setState jen jednou za akci.
 * Hraje jen se zaostřenou obrazovkou a bez omezení pohybu; během reakce (`busyMs` od jejího začátku) a ve spánku
 * čeká. Nová reakce idle přeruší sama (`useReactionMotion` zruší všechny hodnoty), plánovač jen posune další akci.
 * `rng` jde injektovat (testy: `mulberry32`); `sinceInteraction` povolí zívnutí před usnutím.
 */
export function useMascotIdle({ context = 'default', focused, reaction, sinceInteraction, rng = Math.random, enabled = true }: {
  context?: IdleContext; focused: boolean; reaction: MascotReaction | null | undefined;
  sinceInteraction?: () => number; rng?: Rng; enabled?: boolean;
}): MascotIdle | null {
  const { reduced } = useMotionSafe();
  const [idle, setIdle] = useState<MascotIdle | null>(null);
  const [tick, setTick] = useState(0);
  const key = useRef(0);
  const last = useRef<IdleActionId | null>(null);
  const reactionAt = useRef(-Infinity);
  const rngRef = useRef(rng);
  const sinceRef = useRef(sinceInteraction);
  useEffect(() => { rngRef.current = rng; sinceRef.current = sinceInteraction; }, [rng, sinceInteraction]);
  const sleeping = reaction?.id === 'sleep';
  const reactionKey = reaction?.key ?? null;
  useEffect(() => { if (reactionKey !== null) reactionAt.current = Date.now(); }, [reactionKey]);

  const active = enabled && focused && !reduced && !sleeping;
  useEffect(() => {
    if (!active) return;
    const wait = Math.max(nextIdlePause(rngRef.current, context, CFG), busyLeft(Date.now(), reactionAt.current, CFG.busyMs));
    const id = setTimeout(() => {
      const now = Date.now();
      if (canIdle({ enabled, focused, reduced, sleeping, now, reactionAt: reactionAt.current, busyMs: CFG.busyMs })) {
        const a = pickIdleAction(rngRef.current, context, CFG, last.current, sinceRef.current?.() ?? null);
        if (a) {
          last.current = a;
          key.current += 1;
          setIdle({ id: a, key: key.current });
        }
      }
      setTick((n) => n + 1);
    }, wait);
    return () => clearTimeout(id);
    // Nová reakce plánovač přeplánuje (pauza se počítá od jejího konce).
  }, [active, tick, reactionKey, context, enabled, focused, reduced, sleeping]);

  return active ? idle : null;
}
