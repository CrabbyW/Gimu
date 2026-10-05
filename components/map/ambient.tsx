import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';

const A = motion.ambient;
const Ctx = createContext<SharedValue<number> | null>(null);

/**
 * Jedna ambientní hodina mapy (0 → 1 za `motion.ambient.clockMs`, pak znovu od 0) pro všechny kotouče: místo
 * desítek nekonečných animací jeden frame callback na UI vlákně. Perioda je společný násobek rotace volného
 * (40 s) i aktuálního (24 s) kotouče, komety (8 s) a dechu (2.4 s), takže přetočení hodiny nedá skok.
 * Běží jen na zaostřené obrazovce; s omezeným pohybem stojí (ambient stop).
 */
export function AmbientClock({ children }: { children: ReactNode }) {
  const { reduced } = useMotionSafe();
  const t = useSharedValue(0);
  const frame = useFrameCallback((f) => {
    const dt = f.timeSincePreviousFrame ?? 0;
    // Strop kroku: po probuzení appky nebo zaseknutí snímku kotouč neposkočí.
    t.value = (t.value + Math.min(dt, 64) / A.clockMs) % 1;
  }, false);
  useFocusEffect(useCallback(() => {
    frame.setActive(!reduced);
    return () => frame.setActive(false);
    // `frame` je stabilní objekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]));
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>;
}

/** Hodina mapy (null mimo `AmbientClock` = nic se netočí). */
export const useAmbientClock = () => useContext(Ctx);

/** Kolik otáček za jednu periodu hodiny udělá kotouč s periodou `ms` (celé číslo, viz `AmbientClock`). */
export const turnsPerClock = (ms: number) => Math.round(A.clockMs / ms);
