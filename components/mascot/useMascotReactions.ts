import { NavigationContext } from 'expo-router/build/react-navigation/core';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { feedback } from '@/lib/feedback';
import { useMotionSafe } from '@/lib/motion';
import { degrade, IDLE_MS, isIdle, pickReaction, REACTION_COOLDOWN_MS, type MascotEvent, type ReactionId, type ReactionState } from '@/logic/mascotReactions';
import type { MascotReaction } from './types';

const FRESH: ReactionState = { lastId: null, lastAt: -Infinity, taps: [] };

/** Zaostření obrazovky; mimo navigaci (testy, kořen) vždy true. Opička na jiném tabu neusíná (`isIdle`). */
export function useScreenFocused(): boolean {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (nav ? nav.isFocused() : true));
  useEffect(() => {
    if (!nav) return;
    const offFocus = nav.addListener('focus', () => setFocused(true));
    const offBlur = nav.addListener('blur', () => setFocused(false));
    return () => { offFocus(); offBlur(); };
  }, [nav]);
  return focused;
}

export interface MascotReactions {
  /** Ohlášení události z obrazovky; vrátí přehranou reakci (po `degrade`), nebo null (cooldown, priorita).
   *  `quietHop`: obyčejný poskok z ťuknutí se nepřehraje (obrazovka místo něj hraje akci zóny ťuknutí,
   *  `headShake`/`giggle`); série ťuknutí se dál počítá, takže rychlé ťukání dá salto. */
  report(e: MascotEvent, opts?: { quietHop?: boolean }): ReactionId | null;
  /** Ťuknutí na opičku teď (zkratka za `report({ type: 'tap', at: Date.now() })`). */
  tap(): ReactionId | null;
  /** Dotyk kdekoli na obrazovce: nuluje nečinnost a probudí spící opičku. */
  poke(): void;
  /** Pro `<Mascot reaction>`. */
  reaction: MascotReaction | null;
  /** Pro `<Mascot gaze>`: bod prstu v okně, nebo null. */
  gaze: ReturnType<typeof useSharedValue<{ x: number; y: number } | null>>;
  /** Zaostření obrazovky (plánovač idle akcí hraje jen se zaostřenou). */
  focused: boolean;
  /** Kolik ms uběhlo od posledního doteku (zívnutí před usnutím). */
  sinceInteraction(): number;
  /** Gesto pro `GestureDetector` kolem plochy, po které má opička sledovat prst. Nikdy se neaktivuje
   *  (`Manual`): nekrade scroll, tap ani roztočení kotouče. */
  touch: ReturnType<typeof Gesture.Manual>;
}

/**
 * Spojení událostí obrazovky s logikou reakcí (`logic/mascotReactions`). Stav výběru (cooldown, série ťuknutí)
 * žije v refu, React stav jen pro přehrávanou reakci. Nečinnost se počítá jen se zaostřenou obrazovkou;
 * návrat do appky přes `AppState` (mávnutí jen po ≥ 60 s, `shouldWave`). Omezený pohyb: `degrade`.
 * Haptika: poskok `selection`, salto a skok radosti `success`; ostatní reakce jsou tiché.
 */
export function useMascotReactions(focused: boolean, opts?: {
  /** Návrat do appky: obrazovka ho může přehrát vlastní akcí repertoáru (mapa: `waveRun`); `true` = vyřízeno,
   *  stará reakce (mávnutí) se pak nehraje. */
  onAppReturn?(awayMs: number): boolean;
}): MascotReactions {
  const onAppReturn = useRef(opts?.onAppReturn);
  useEffect(() => { onAppReturn.current = opts?.onAppReturn; });
  const { reduced } = useMotionSafe();
  const reducedRef = useRef(reduced);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);
  const state = useRef<ReactionState>(FRESH);
  const lastInteraction = useRef(0);
  useEffect(() => { lastInteraction.current = Date.now(); }, []);
  const [reaction, setReaction] = useState<MascotReaction | null>(null);
  const keyRef = useRef(0);
  const asleep = useRef(false);
  const [idleTick, setIdleTick] = useState(0);

  const play = useCallback((id: ReactionId) => {
    keyRef.current += 1;
    asleep.current = id === 'sleep';
    setReaction({ id: degrade(id, reducedRef.current), key: keyRef.current });
  }, []);

  const touched = useCallback(() => {
    // Bez re-renderu: dotek (i každá událost scrollu, ~30/s) jen posune čas; běžící časovač nečinnosti
    // se při vypršení sám přeplánuje (QA fáze 3: dřív setState při každém scrollu překresloval celou mapu).
    lastInteraction.current = Date.now();
    if (asleep.current) {
      // Probuzení: klid (oči se otevřou); případná reakce na stejný dotek přijde hned po něm.
      asleep.current = false;
      setReaction(null);
      setIdleTick((n) => n + 1);
    }
  }, []);

  const report = useCallback((e: MascotEvent, opts?: { quietHop?: boolean }): ReactionId | null => {
    const now = Date.now();
    if (e.type !== 'idle' && e.type !== 'appReturn') touched();
    const r = pickReaction(e, state.current, now);
    state.current = r.state;
    if (!r.id) return null;
    if (r.id === 'hop' && opts?.quietHop) return 'hop';
    if (r.id === 'hop') feedback('mascotTap');
    else if (r.id === 'flip' || r.id === 'joyJump') feedback('mascotJoy');
    play(r.id);
    return degrade(r.id, reducedRef.current);
  }, [play, touched]);

  const tap = useCallback(() => report({ type: 'tap', at: Date.now() }), [report]);

  // Nečinnost: jeden časovač od posledního doteku, jen se zaostřenou obrazovkou. Usne jednou, další spánek až po doteku.
  useEffect(() => {
    if (!focused || asleep.current) return;
    // Spodní mez = cooldown: opakovaný pokus po zahozeném spánku nesmí běžet v těsné smyčce.
    const wait = Math.max(REACTION_COOLDOWN_MS, IDLE_MS - (Date.now() - lastInteraction.current));
    const id = setTimeout(() => {
      // Neusnula (mezitím dotek, nebo spánek zahodil cooldown jiné reakce): naplánovat znovu.
      if (!isIdle(lastInteraction.current, Date.now(), focused) || !report({ type: 'idle' })) setIdleTick((n) => n + 1);
    }, wait);
    return () => clearTimeout(id);
  }, [focused, idleTick, report]);
  // Návrat na obrazovku je interakce: počítá se znovu od nuly.
  useEffect(() => { if (focused) lastInteraction.current = Date.now(); }, [focused]);

  // Návrat do appky.
  useEffect(() => {
    let leftAt: number | null = null;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        if (leftAt !== null && focused) {
          const awayMs = Date.now() - leftAt;
          touched();
          if (!onAppReturn.current?.(awayMs)) report({ type: 'appReturn', awayMs });
        }
        leftAt = null;
      } else if (leftAt === null) {
        leftAt = Date.now();
      }
    });
    return () => sub.remove();
  }, [focused, report, touched]);

  const gaze = useSharedValue<{ x: number; y: number } | null>(null);
  // Počet doteků: gesto ho zvedne na UI vlákně, reakce na JS vlákně vynuluje nečinnost a probudí opičku.
  const downs = useSharedValue(0);
  useAnimatedReaction(() => downs.value, (v, prev) => { if (prev !== null && v !== prev) scheduleOnRN(touched); }, [touched]);
  const touch = useMemo(() => Gesture.Manual()
    .shouldCancelWhenOutside(false)
    .onTouchesDown((e) => {
      const t = e.allTouches[0];
      if (t) gaze.set({ x: t.absoluteX, y: t.absoluteY });
      downs.set(downs.value + 1);
    })
    .onTouchesMove((e) => {
      const t = e.allTouches[0];
      if (t) gaze.set({ x: t.absoluteX, y: t.absoluteY });
    })
    .onTouchesUp(() => { gaze.set(null); })
    .onTouchesCancelled(() => { gaze.set(null); })
    .onFinalize(() => { gaze.set(null); }),
  [gaze, downs]);

  const sinceInteraction = useCallback(() => Date.now() - lastInteraction.current, []);

  return { report, tap, poke: touched, reaction, gaze, touch, focused, sinceInteraction };
}
