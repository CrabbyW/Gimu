import { NavigationContext } from 'expo-router/build/react-navigation/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { motion, silhouettePhase, useMotionSafe } from '@/lib/motion';

/** Zaostření obrazovky; mimo navigaci (testy) vždy true. */
function useFocused(): boolean {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (nav ? nav.isFocused() : true));
  useEffect(() => {
    if (!nav) return;
    const a = nav.addListener('focus', () => setFocused(true));
    const b = nav.addListener('blur', () => setFocused(false));
    return () => { a(); b(); };
  }, [nav]);
  return focused;
}

function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/**
 * Fáze smyčky siluety (U3). Běží jen když `playing`, obrazovka je zaostřená a appka v popředí; jinak
 * stojí na poslední fázi (pauza, žádné snímky). Reduce Motion: stále 0 bez časovače.
 * Překreslení omezené na `motion.silhouette.fps` přes interval (Svg z Circle nejde animovat na UI vlákně
 * bez přepisu geometrie do workletu; 30 fps × ~40 teček je levné a čas se počítá z hodin, ne z ticků).
 */
export function useSilhouettePhase(kind: 'reps' | 'hold', playing = true): number {
  const { reduced } = useMotionSafe();
  const focused = useFocused();
  const active = useAppActive();
  const run = playing && focused && active && !reduced;
  const [phase, setPhase] = useState(0);
  const last = useRef(0);
  const period = kind === 'hold' ? motion.silhouette.holdMs : motion.silhouette.repsMs;
  useEffect(() => {
    if (!run) return;
    // Navázat na aktuální fázi, ať se po pauze neskočí: elapsed odvozený z poslední fáze (vzestupná větev).
    const start = Date.now() - (Math.acos(1 - 2 * last.current) / (2 * Math.PI)) * period;
    const id = setInterval(() => {
      const v = silhouettePhase(Date.now() - start, period);
      last.current = v;
      setPhase(v);
    }, 1000 / motion.silhouette.fps);
    return () => clearInterval(id);
  }, [run, period]);
  return reduced ? 0 : phase;
}
