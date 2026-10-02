import { useEffect, useRef, useState } from 'react';
import { useMotionSafe } from '@/lib/motion';

const easeOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Čistě pohybový hook: při prvním zobrazení napočítá číslo od 0 do `target` (expo.out), další změny
 * hodnoty ukáže hned. Stav appky se nemění, animace jen znázorňuje. Omezený pohyb: rovnou konečné číslo.
 * `delayMs` = začátek ve sledu choreografie, `enabled: false` = bez napočítání (už viděná obrazovka).
 * `decimals` = zaokrouhlení mezikroků (váha 0.1 kg → 1).
 */
export function useCountUp(target: number, durationMs: number, decimals = 0, opts: { delayMs?: number; enabled?: boolean } = {}): number {
  const { reduced } = useMotionSafe();
  const { delayMs = 0, enabled = true } = opts;
  const [shown, setShown] = useState(reduced || !enabled ? target : 0);
  const played = useRef(!enabled);

  useEffect(() => {
    if (played.current || reduced || target === 0) {
      played.current = true;
      setShown(target);
      return;
    }
    played.current = true;
    const f = 10 ** decimals;
    let frame = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      start ??= t + delayMs;
      const p = Math.max(0, Math.min(1, (t - start) / durationMs));
      setShown(p >= 1 ? target : Math.round(easeOut(p) * target * f) / f);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); setShown(target); };
  }, [target, durationMs, decimals, reduced, delayMs]);

  return shown;
}
