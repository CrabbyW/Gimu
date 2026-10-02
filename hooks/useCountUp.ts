import { useEffect, useRef, useState } from 'react';
import { useMotionSafe } from '@/lib/motion';

const easeOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Čistě pohybový hook: při prvním zobrazení napočítá číslo od 0 do `target` (expo.out), další změny
 * hodnoty ukáže hned. Stav appky se nemění, animace jen znázorňuje. Omezený pohyb: rovnou konečné číslo.
 * `decimals` = zaokrouhlení mezikroků (váha 0.1 kg → 1).
 */
export function useCountUp(target: number, durationMs: number, decimals = 0): number {
  const { reduced } = useMotionSafe();
  const [shown, setShown] = useState(reduced ? target : 0);
  const played = useRef(false);

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
      start ??= t;
      const p = Math.min(1, (t - start) / durationMs);
      setShown(p >= 1 ? target : Math.round(easeOut(p) * target * f) / f);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); setShown(target); };
  }, [target, durationMs, decimals, reduced]);

  return shown;
}
