import { useCallback, useEffect, useRef, useState } from 'react';
import { now as clockNow } from '@/lib/clock';
import { fire } from '@/lib/haptics';
import { canStart, IDLE_GATE, IDLE_RETRY_MS, idleMayStart, PRIO, type ActGate } from '@/lib/mascotAct';
import { repertoire, useMotionSafe } from '@/lib/motion';
import { ACT_SPEC, type ActId } from '@/lib/repertoireMotion';
import type { Rng } from '@/logic/mascotIdle';
import { nextPause, pickMapIdle, REPERTOIRE_HAPTIC, type MapIdleInput, type RepertoireId } from '@/logic/mascotRepertoire';
import type { MascotAct } from './types';

export interface MascotActs {
  /** Pro `<Mascot act>`. */
  act: MascotAct | null;
  /** Spustí akci, když to pravidla dovolí (`lib/mascotAct`); vrátí, zda začala. */
  play(id: ActId, prio?: number, opts?: { haptic?: boolean }): boolean;
  /** Ukončí běžící akci (opice se vrátí do pózy obrazovky). */
  stop(): void;
  /** Běží teď nějaká akce? */
  busy(): boolean;
}

const isHaptic = (id: ActId): id is RepertoireId => REPERTOIRE_HAPTIC.has(id as RepertoireId);

/**
 * Stav akcí repertoáru jedné obrazovky: jedna akce najednou, priority, haptika jen u `REPERTOIRE_HAPTIC`
 * (ve zlomku osy z `ACT_SPEC`, bez zvuku; s omezeným pohybem hned). Akce skončí sama po své délce.
 */
export function useMascotAct(): MascotActs {
  const { reduced } = useMotionSafe();
  const [act, setAct] = useState<MascotAct | null>(null);
  const gate = useRef<ActGate>(IDLE_GATE);
  const key = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const play = useCallback((id: ActId, prio: number = PRIO.user, opts?: { haptic?: boolean }) => {
    const t0 = Date.now();
    if (!canStart(gate.current, t0, prio)) return false;
    clear();
    const spec = ACT_SPEC[id];
    const ms = reduced ? repertoire.reducedMs : spec.ms;
    key.current += 1;
    const k = key.current;
    gate.current = { until: t0 + ms, prio };
    setAct({ id, key: k });
    // Obrazovka s vlastním hmatovým podpisem (stage-up) může haptiku akce vypnout, ať nebzučí dvakrát.
    if (spec.haptic && isHaptic(id) && opts?.haptic !== false) {
      const kind = spec.haptic.kind;
      timers.current.push(setTimeout(() => fire(kind), reduced ? 0 : spec.haptic.at * spec.ms));
    }
    timers.current.push(setTimeout(() => {
      gate.current = IDLE_GATE;
      setAct((a) => (a?.key === k ? null : a));
    }, ms));
    return true;
  }, [reduced]);

  const stop = useCallback(() => { clear(); gate.current = IDLE_GATE; setAct(null); }, []);
  const busy = useCallback(() => Date.now() < gate.current.until, []);
  return { act, play, stop, busy };
}

/**
 * Plánovač idle akcí na mapě: první pokus po `repertoire.idleFirstMs`, pak `nextPause` (20–40 s). Výběr jen přes
 * `pickMapIdle` (série v ohrožení, ukázat na Start, denní doba, náhoda). Nikdy nepřeruší sekvenci mapy
 * (`blocked`: odemčení, skok po splashi, pull-to-refresh) ani jinou akci; tehdy zkusí znovu za `IDLE_RETRY_MS`.
 */
export function useMapIdleActs({ acts, focused, blocked, input, rng = Math.random, enabled = true }: {
  acts?: MascotActs; focused: boolean; blocked(): boolean;
  input(): Omit<MapIdleInput, 'now' | 'last'>; rng?: Rng; enabled?: boolean;
}) {
  const { reduced } = useMotionSafe();
  const last = useRef<RepertoireId | null>(null);
  const live = useRef({ acts, blocked, input, rng });
  useEffect(() => { live.current = { acts, blocked, input, rng }; });
  useEffect(() => {
    if (!enabled || !focused || reduced || !acts) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const L = live.current;
      const A = L.acts;
      if (!A || !idleMayStart({ focused, reduced, blocked: L.blocked(), busy: A.busy() })) { timer = setTimeout(tick, IDLE_RETRY_MS); return; }
      const id = pickMapIdle(L.rng, { now: clockNow(), ...L.input(), last: last.current });
      if (id && A.play(id, PRIO.idle)) last.current = id;
      timer = setTimeout(tick, nextPause(L.rng) + (id ? ACT_SPEC[id].ms : 0));
    };
    timer = setTimeout(tick, repertoire.idleFirstMs);
    return () => clearTimeout(timer);
    // Plánovač žije s mapou; aktuální vstupy čte z refu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, focused, reduced, acts === undefined]);
}
