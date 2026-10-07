import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '@/data/copy';
import { now } from '@/lib/clock';
import { lineContext, pickLine, type Line } from '@/logic/mascotLines';
import { REACTION_COOLDOWN_MS } from '@/logic/mascotReactions';

/** Jak dlouho replika visí (spec fáze 3 §3). */
export const LINE_SHOW_MS = 2400;

/**
 * Replika opičky na ťuknutí (elite fáze 3): `say()` vybere větu podle denní doby, série a dneška,
 * nikdy dvakrát stejnou za sebou. Během zobrazení se text vymění až po cooldownu reakcí.
 * `blocked` (např. viditelný průvodce) = opička mlčí.
 */
export function useMascotLine(stats: { streak: number; todayDone: boolean } | null, blocked = false) {
  const [line, setLine] = useState<Line | null>(null);
  const lastId = useRef<string | null>(null);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const say = useCallback(() => {
    if (blocked || !stats) return;
    const t = Date.now();
    if (shownAt.current && t - shownAt.current < REACTION_COOLDOWN_MS) return;
    const ctx = lineContext({ hour: now().getHours(), streak: stats.streak, todayDone: stats.todayDone });
    const next = pickLine(copy.mascotLines, ctx, Math.random, lastId.current);
    if (!next) return;
    lastId.current = next.id; shownAt.current = t;
    setLine(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setLine(null); shownAt.current = 0; }, LINE_SHOW_MS);
  }, [blocked, stats]);

  // Průvodce má přednost: když se objeví, replika hned zmizí (odvozeno při renderu, ne efektem).
  return { line: blocked ? null : line, say };
}
