import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View, useWindowDimensions, type ScrollView } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { LineBubbleMotion, Mascot, MASCOT_SIZES, MonkeyBack, MonkeyFront, mascotSeatY, ReactiveMascot, type MascotReactions } from '@/components/mascot';
import { IntentScrollView, plateOuterRadius } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { haptics } from '@/lib/haptics';
import { playSfx } from '@/lib/sound';
import { ease, intro as T, motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import type { LessonPathView, MapNode } from '@/services/contracts';
import { dots, useTheme } from '@/theme';
import type { CosmeticSlot, MascotStage, Mood } from '@/types';
import { AmbientClock } from './ambient';
import { BarbellBoss } from './BarbellBoss';
import { BOSS_SIZE, LABEL_GAP, SECTION_LABEL_OFFSET, labelHeight, layoutNodes, popoverSide, type NodePosition } from './geometry';
import { NodePopover } from './NodePopover';
import { PathLine } from './PathLine';
import { PlateNode } from './PlateNode';
import { HAPPY_MS, UNLOCK_STEPS, findUnlockPair, unlockFrame, type UnlockPhase } from './unlockSequence';

const MASCOT = MASCOT_SIZES.S;
const MASCOT_GAP = 16;
/** Plátno maskota má viewBox 200; kotva sezení (`mascotSeatY`) je v jeho jednotkách. */
const MASCOT_VIEWBOX = 200;
/** Přeskok opičky na nový uzel (motion spec §3.1): start po dosednutí odemčeného uzlu +120 ms, přikrčení,
 *  oblouk po dobu `motion.fall` (vodorovně rovnoměrně, svisle parabola = gravitace), dopad: propad o `dip`
 *  a dosednutí `motion.settle`, soft (`monkeyHop`). */
const HOP = motion.mapHop;
const POPOVER_ROOM = 220; // odhad výšky popoveru (i se zavírací ikonou) pro volbu strany
const TEXTURE_STEP = 24;

interface Props {
  view: LessonPathView;
  /** `mood` = klidová nálada z aktivity (`logic/mascotMood`); skok při odemčení ji dočasně přebije. */
  stats: { stage: MascotStage; mood: Mood };
  /** Odhad minut na lekci podle id (`estMinutes` z cviků). */
  minutesOf: Record<string, number>;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  /** Právě odemčená lekce z route param `?unlocked=`; spustí odemykací sekvenci. */
  unlockedLessonId?: string | null;
  onOpenLesson(id: string): void;
  /** Sekvence doběhla (nebo byla přeskočena); volající smaže route param. */
  onUnlockSequenceEnd?(): void;
  /** Úvodní sled (motion, první zobrazení): kotouče se usadí shora dolů k aktuálnímu uzlu, opice poslední. */
  intro?: boolean;
  /** Místo pod posledním uzlem pro plovoucí CTA obrazovky (pt), aby ho šlo odscrollovat. */
  footerSpace?: number;
  /** Výška překryvné hlavičky obrazovky (pt): mapa běží přes celou výšku a první prvek začíná pod ní.
   *  Souřadnice uzlů zůstávají vnitřní (posunutý obal); viditelný výřez = [scrollY, scrollY + výška − topInset − footerSpace]. */
  topInset?: number;
  /** Dojezd změny `topInset` (pt, → 0): obsah se posune o tolik dolů, takže změna výšky hlavičky neskočí. */
  insetShift?: SharedValue<number>;
  /** Reakce opičky (fáze 3): opička na mapě je hratelná a reaguje na scroll, roztočení kotouče a ztrátu série. */
  reactions?: MascotReactions;
  /** Replika opičky (elite fáze 3, `useMascotLine`): bublina nad opičkou, null = žádná. */
  line?: string | null;
  /** Ťuknutí na hratelnou opičku (volající zavolá `useMascotLine().say`). */
  onMascotTap?(): void;
}

/** Programový scroll (dojetí na uzel, popover) není uživatelův pohyb: opička se po tuto dobu nedívá dolů. */
const PROGRAMMATIC_SCROLL_MS = 700;
const SCROLL_GAP_MS = 200;

/** Teplá litina §2.7: opička SEDÍ na horní hraně kotouče (sourozenec kotouče, ne dítě: kotouč smí pulzovat,
 *  opička ne). Smutná a u bosse sedí vedle uzlu na opačné straně vlny. */
const mascotSpot = (p: NodePosition, cx: number, isBoss: boolean, beside: boolean, stage: MascotStage) => {
  // Kotva (spec §2.7, z-order): spodní hrana trupu leží na středu horní hrany kotouče; nohy a konec šálu
  // (MonkeyFront) visí přes čelo kotouče.
  // Nothing Dot: hrana = vnější hrana teček `DotPlate` (`plateOuterRadius`), opička sedí na horní tečce.
  if (!isBoss && !beside) return { x: p.x, y: p.y - plateOuterRadius(p.size) - (mascotSeatY(stage) / MASCOT_VIEWBOX - 0.5) * MASCOT };
  const half = isBoss ? BOSS_SIZE.w / 2 : p.size / 2;
  const side = p.x < cx ? 1 : -1;
  return { x: p.x + side * (half + MASCOT_GAP + MASCOT / 2), y: p.y };
};

export function LessonMap({ view, stats, minutesOf, cosmetics, unlockedLessonId = null, onOpenLesson, onUnlockSequenceEnd, intro = false, footerSpace = 0, topInset = 0, insetShift, reactions, line = null, onMascotTap }: Props) {
  const { space, seasonal, size } = useTheme();
  const { reduced } = useMotionSafe();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cx = width / 2;
  const scroll = useRef<ScrollView>(null);
  const [viewportH, setViewportH] = useState(0);
  const scrollY = useRef(0);

  const flat = useMemo(() => view.sections.flatMap((s) => s.nodes.map((n) => ({ ...n, section: s }))), [view]);
  const layout = useMemo(
    // Layout podle cílového stavu (ne mezisnímku odemčení), aby uzly během sekvence neposkakovaly.
    () => layoutNodes(flat.map((n) => ({ id: n.lesson.id, isBoss: n.lesson.isBoss, state: n.state, sectionStart: n.section.nodes[0]?.lesson.id === n.lesson.id })), width),
    [flat, width],
  );
  const height = layout.height + insets.bottom + footerSpace;
  const posOf = useCallback((id: string) => layout.positions.find((p) => p.id === id), [layout]);

  // --- Odemykací sekvence (spec §7.2) ---
  const pair = useMemo(() => findUnlockPair(flat.map((n) => ({ id: n.lesson.id, state: n.state })), unlockedLessonId), [flat, unlockedLessonId]);
  const pairKey = pair ? `${pair.prevId}>${pair.nextId}` : null;
  // Fáze patří konkrétnímu páru: nový pár začíná na 0 už v prvním renderu (bez probliknutí konečného stavu).
  const [seq, setSeq] = useState<{ key: string | null; phase: UnlockPhase }>({ key: null, phase: 0 });
  const phase: UnlockPhase = pairKey !== null && seq.key === pairKey ? seq.phase : 0;
  const advance = useCallback((next: UnlockPhase) => setSeq((s) => {
    const cur = s.key === pairKey ? s.phase : 0;
    return cur < next ? { key: pairKey, phase: next } : s;
  }), [pairKey]);
  // --- Úvodní sled (motion): jen bez odemykací sekvence. Plán se rozhodne jednou při mountu. ---
  const [plan] = useState(() => {
    if (!intro || pair) return null;
    const ci = Math.max(0, view.currentLessonId ? flat.findIndex((n) => n.lesson.id === view.currentLessonId) : flat.length - 1);
    const from = Math.max(0, ci - T.map.plateWindow);
    const at = (i: number) => (i < from ? null : T.map.plates + (Math.min(i, ci) - from) * T.map.plateStep);
    return { ci, from, at, mascotAt: T.map.plates + (ci - from) * T.map.plateStep + T.map.mascotLag };
  });
  // S omezeným pohybem se sekvence nepřehrává: rovnou konečný stav.
  const frame = unlockFrame(pair && !reduced ? phase : null);
  const endRef = useRef(onUnlockSequenceEnd);
  useLayoutEffect(() => { endRef.current = onUnlockSequenceEnd; });

  // Rychlost scrollu pro reakce opičky (lookDown / dizzy); programový scroll se nepočítá.
  const programmaticUntil = useRef(0);
  const lastScroll = useRef<{ y: number; at: number } | null>(null);
  const scrollTo = useCallback((y: number, animated: boolean) => {
    programmaticUntil.current = Date.now() + PROGRAMMATIC_SCROLL_MS;
    scroll.current?.scrollTo({ y, animated });
  }, []);
  const scrollToNode = useCallback((id: string, animated: boolean) => {
    const p = posOf(id);
    // Uzel na 40 % viditelného výřezu (pod překryvnou hlavičkou, nad pruhem CTA `footerSpace`) (vnitřní souřadnice: horní hrana výřezu = scrollY).
    if (p && viewportH > 0) scrollTo(Math.max(0, p.y - Math.max(0, viewportH - topInset - footerSpace) * 0.4), animated);
  }, [posOf, viewportH, topInset, footerSpace, scrollTo]);

  // Omezený pohyb: opička se na nový uzel jen prolne (200 ms), bez oblouku.
  const crossfade = useSharedValue(1);
  // Dojezd změny výšky hlavičky (index.tsx): jen sdílená hodnota, ve workletu nic jiného.
  const noShift = useSharedValue(0);
  const shift = insetShift ?? noShift;
  const shiftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shift.value }] }));

  // Parametr bez platného páru: neznámá nebo už dokončená lekce se jen smaže. Zamčená znamená,
  // že mapa ještě ukazuje data před dokončením lekce; počká se na nová.
  const unlockedState = flat.find((n) => n.lesson.id === unlockedLessonId)?.state;
  const stale = unlockedLessonId !== null && !pair && unlockedState !== 'locked';
  useEffect(() => { if (stale) endRef.current?.(); }, [stale]);

  useEffect(() => {
    if (!pairKey) return;
    if (reduced) {
      // Omezený pohyb: konečný stav (viz frame), opička se prolne na nový uzel; haptika a zvuk zůstávají.
      haptics.unlock();
      playSfx('unlock');
      crossfade.value = 0;
      crossfade.value = withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never });
      endRef.current?.();
      return;
    }
    const timers = UNLOCK_STEPS.map(({ phase: next, at }) => setTimeout(() => advance(next), at));
    return () => timers.forEach(clearTimeout);
    // Sekvence patří páru uzlů; reduced se během ní nemění.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairKey]);

  // Fáze 1: dojede scroll na dokončený uzel. Bez sekvence: po otevření scroll na aktuální uzel.
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (viewportH === 0) return;
    if (pair && !reduced && phase === 1) { scrollToNode(pair.prevId, true); initialScrollDone.current = true; return; }
    if ((!pair || reduced) && !initialScrollDone.current && view.currentLessonId) {
      initialScrollDone.current = true;
      // Při úvodním sledu skok bez animace: kotouče se usazují v klidném výřezu, ne během rolování.
      scrollToNode(view.currentLessonId, !plan);
    }
  }, [pair, reduced, phase, viewportH, scrollToNode, view.currentLessonId, plan]);

  // --- Opice ---
  const mascotNodeId = pair ? (frame.mascotOn === 'prev' ? pair.prevId : pair.nextId) : view.currentLessonId;
  const mascotNode = flat.find((n) => n.lesson.id === mascotNodeId);
  const mascotPos = mascotNode ? posOf(mascotNode.lesson.id) : undefined;
  const hopping = pair !== null && !reduced && phase === 5;
  // Fáze 5 trvá HAPPY_MS: po celou dobu skoku a doskoku má opice radost.
  const mood: Mood = hopping ? 'happy' : stats.mood;
  const spot = mascotPos && mascotNode ? mascotSpot(mascotPos, cx, mascotNode.lesson.isBoss, mood === 'sad', stats.stage) : null;
  const seated = mascotNode !== undefined && !mascotNode.lesson.isBoss && mood !== 'sad';
  const mx = useSharedValue(spot?.x ?? 0);
  const my = useSharedValue(spot?.y ?? 0);
  const fromX = useSharedValue(spot?.x ?? 0);
  const fromY = useSharedValue(spot?.y ?? 0);
  const arcT = useSharedValue(1);
  const dy = useSharedValue(0);
  useEffect(() => {
    if (!spot) return;
    if (!hopping) { mx.value = spot.x; my.value = spot.y; fromX.value = spot.x; fromY.value = spot.y; arcT.value = 1; return; }
    // Fáze 5: oblouk ze starého uzlu na nový. Svislý poskok `<Mascot />` je vypnutý (`hop={false}`),
    // jinak by opice skočila dvakrát. Vše na UI vlákně; soft při dosednutí ze stejného callbacku.
    const h = motion.hop;
    fromX.value = mx.value;
    fromY.value = my.value;
    mx.value = spot.x;
    my.value = spot.y;
    arcT.value = 0;
    dy.value = withDelay(HOP.delay, withTiming(HOP.crouch, { duration: h.crouchMs, easing: ease.out }));
    arcT.value = withDelay(HOP.delay + h.crouchMs, withTiming(1, { duration: motion.fall.duration, easing: Easing.linear }, (done) => {
      if (!done) return;
      dy.value = withSequence(withTiming(HOP.dip, { duration: h.landMs, easing: ease.out }), withSpring(0, motion.settle));
      scheduleOnRN(feedback, 'monkeyHop');
    }));
    const t = setTimeout(() => {
      advance(6);
      endRef.current?.();
    }, HAPPY_MS);
    return () => clearTimeout(t);
    // Spouští se změnou cílové pozice nebo začátkem skoku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.x, spot?.y, hopping]);
  // Příchod opice v úvodním sledu: poslední úder, spadne o 20 pt a dosedne pružinou `motion.settle`
  // (fyzický prvek). Omezený pohyb: jen prolnutí 200 ms.
  const arrive = useSharedValue(plan ? 0 : 1);
  useEffect(() => {
    if (!plan) return;
    arrive.value = reduced
      ? withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never })
      : withDelay(plan.mascotAt, withSpring(1, motion.settle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dropMascot = reduced ? 0 : T.map.mascotDrop;
  const mascotStyle = useAnimatedStyle(() => {
    const t = arcT.value;
    const x = fromX.value + (mx.value - fromX.value) * t;
    const y = fromY.value + (my.value - fromY.value) * t - HOP.arc * 4 * t * (1 - t) + dy.value;
    return {
      opacity: Math.min(1, arrive.value * 1.6) * crossfade.value,
      transform: [{ translateX: x - MASCOT / 2 }, { translateY: y - MASCOT / 2 - (1 - arrive.value) * dropMascot }],
    };
  });

  // --- Reakce opičky (fáze 3) ---
  // Úhel roztočení aktuálního kotouče: opička za ním otáčí hlavu a pupily (`spinFollow`).
  const plateSpin = useSharedValue(0);
  const report = reactions?.report;
  const onSpinStart = useCallback(() => { report?.({ type: 'plateSpin' }); }, [report]);
  // Směr scrollu (-1 nahoru … 1 dolů): opička se natočí za ním (pupily a hlava), pak se vrátí dopředu.
  const scrollLook = useSharedValue(0);
  // Ztráta série: opička se při otevření mapy zesmutní (po příchodu v úvodním sledu, ať je vidět).
  const sadOnOpen = stats.mood === 'sad';
  useEffect(() => {
    if (!sadOnOpen || !report) return;
    const id = setTimeout(() => report({ type: 'streakLost' }), plan && !reduced ? plan.mascotAt : 0);
    return () => clearTimeout(id);
    // Jednou při otevření mapy se ztracenou sérií.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sadOnOpen]);

  // --- Replika opičky (elite fáze 3) ---
  // Bublina má pevnou šířku (≤ `dots.line.maxW`, ≥ `edge` od hran displeje) a posouvá se od kraje; hrot míří na střed opičky.
  const L = dots.line;
  const lineW = Math.min(L.maxW, width - L.edge * 2);
  const lineLeft = spot ? Math.min(Math.max(L.edge, spot.x - lineW / 2), width - L.edge - lineW) : 0;
  // Bublina nad opičkou nesmí zajet pod překryvnou hlavičku: chybí-li nad opičkou místo `L.room`, mapa o rozdíl sjede.
  const spotTop = spot ? spot.y - MASCOT / 2 : 0;
  useEffect(() => {
    if (!line || !spot) return;
    const deficit = L.room - (spotTop - scrollY.current);
    if (deficit > 0) scrollTo(Math.max(0, scrollY.current - deficit), !reduced);
    // Jen při objevení repliky.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  // --- Popover a zatřesení ---
  const [selected, setSelected] = useState<{ id: string; above: boolean } | null>(null);
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const onNodePress = (n: MapNode, shown: NodeState) => {
    // Aktuální uzel má vlastní „Začít lekci“; tap na kotouč dělá totéž (popover jen pro zamčené a hotové).
    if (shown === 'current') { setSelected(null); onOpenLesson(n.lesson.id); return; }
    const p = posOf(n.lesson.id);
    // Dokončený uzel nahoru (nepřekryje aktuální uzel ani opici), jinak dolů; podle místa ve výřezu.
    // Spodek výřezu bez pruhu s CTA (`footerSpace`), který mapu překrývá — jinak se popover schová pod pilulku.
    // Překryvná hlavička (`topInset`) zakrývá horní kus výřezu: vnitřní horní hrana viditelné mapy = scrollY.
    const visibleBottom = scrollY.current + viewportH - topInset - footerSpace;
    const nodeTop = p ? p.y - p.size / 2 : 0;
    const nodeBottom = p ? p.y + p.size / 2 : 0;
    const above = p
      ? popoverSide({
        done: shown === 'done', nodeTop, nodeBottom,
        viewportTop: scrollY.current, viewportBottom: visibleBottom, room: POPOVER_ROOM,
      }) === 'above'
      : false;
    // Když se popover nevejde ani na jednu stranu, posuň mapu o chybějící kus, ať je celý vidět.
    if (p && selected?.id !== n.lesson.id) {
      const deficit = above ? POPOVER_ROOM - (nodeTop - scrollY.current) : POPOVER_ROOM - (visibleBottom - nodeBottom);
      if (deficit > 0) scrollTo(Math.max(0, scrollY.current + (above ? -deficit : deficit)), !reduced);
    }
    setSelected((cur) => (cur?.id === n.lesson.id ? null : { id: n.lesson.id, above }));
    if (shown === 'locked') setShakes((s) => ({ ...s, [n.lesson.id]: (s[n.lesson.id] ?? 0) + 1 }));
  };

  const shownState = (n: MapNode): NodeState => {
    if (pair && n.lesson.id === pair.nextId && frame.next !== 'current') return 'locked';
    return n.state;
  };
  const shown = flat.map(shownState);
  const reached = shown.slice(1).map((s) => s !== 'locked');
  const prevIndex = pair ? flat.findIndex((n) => n.lesson.id === pair.prevId) : -1;
  const drawing = pair && frame.segment === 'draw' ? prevIndex : null;
  const selectedNode = flat.find((n) => n.lesson.id === selected?.id);
  const selectedPos = selected ? posOf(selected.id) : undefined;

  return (
    // Jedna ambientní hodina pro rotaci, kometu a dech všech kotoučů (motion §3), běží jen se zaostřenou mapou.
    <AmbientClock>
    <IntentScrollView
      ref={scroll}
      // Průhledná: pod mapou je `base` obrazovky (a tečkové pole hlavičky), UI zůstává monochromní (spec §2.1).
      // Přes celou výšku obrazovky: hlavička nahoře a CTA dole leží nad mapou, cesta pod nimi plynule odjíždí.
      style={{ flex: 1 }}
      contentContainerStyle={{ height: height + topInset }}
      onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y;
        scrollY.current = y;
        const now = Date.now();
        const prev = lastScroll.current;
        lastScroll.current = { y, at: now };
        if (!reactions || !prev || now < programmaticUntil.current) return;
        const dt = now - prev.at;
        // Mezera mezi událostmi = nový tah: rychlost z ní by byla nesmysl.
        if (dt <= 0 || dt > SCROLL_GAP_MS) return;
        const velocity = ((y - prev.y) / dt) * 1000;
        const SL = motion.mascotIdle.scrollLook;
        scrollLook.value = withSequence(
          withTiming(Math.max(-1, Math.min(1, velocity / SL.fullVelocity)), { duration: SL.inMs, easing: ease.out }),
          withDelay(SL.holdMs, withTiming(0, { duration: SL.outMs, easing: ease.out })),
        );
        reactions.report({ type: 'scroll', velocity });
      }}
      scrollEventThrottle={32}
    >
      {/* Obal posunutý o výšku překryvné hlavičky: všechny vnitřní souřadnice (uzly, cesta, opička, popover)
          zůstávají beze změny, první prvek začíná pod hlavičkou a jde pod ni odscrollovat. Absolutní děti
          by `paddingTop` obsahu ignorovaly, proto margin obalu. */}
      <Animated.View pointerEvents="box-none" style={[{ marginTop: topInset, height }, shiftStyle]}>
      {seasonal.mapTexture ? <DotTexture width={width} height={height} color={seasonal.mapTexture} /> : null}
      <PathLine
        width={width} height={height} positions={layout.positions} reached={reached} drawing={drawing}
        labelBottoms={layout.positions.map((p, i) => p.y + p.size / 2 + LABEL_GAP + labelHeight(flat[i]!.state, flat[i]!.lesson.isBoss))}
        // Začátek sekce: cesta končí nad mono nadpisem sekce (přeruší se, text nekříží).
        ends={layout.positions.map((p, i) => (flat[i]!.section.nodes[0]?.lesson.id === flat[i]!.lesson.id ? p.top - SECTION_LABEL_OFFSET : p.top))}
      />

      {selected ? (
        // Bez viditelného závoje: popover je dlaždice s hranou, plocha jen zachytí tap mimo (závoj jen přes
        // výřez mapy vypadal v light jako chyba a v dark nebyl vidět).
        <Scrim width={width} height={height} color="transparent" onPress={() => setSelected(null)} />
      ) : null}

      {view.sections.map((s) => {
        const first = s.nodes[0];
        const p = first ? posOf(first.lesson.id) : undefined;
        if (!p) return null;
        return (
          <Text
            key={s.index}
            variant="label"
            tone="muted"
            accessibilityRole="header"
            style={{ position: 'absolute', left: space.l, right: space.l, top: p.top - SECTION_LABEL_OFFSET }}
          >
            {copy.map.sectionLabel(s.index, s.title)}
          </Text>
        );
      })}

      {flat.map((n, i) => {
        const p = layout.positions[i]!;
        const state = shown[i]!;
        const label = copy.map.nodeA11y(n.lesson.order, n.lesson.title, n.lesson.plateKg, copy.map.nodeState[state]);
        const unlocking = pair?.nextId === n.lesson.id && frame.next === 'unlocking';
        const onUnlocked = () => advance(5);
        const isPrev = pair?.prevId === n.lesson.id;
        const w = n.lesson.isBoss ? BOSS_SIZE.w : p.size;
        // Sloupec uzlu: kotouč nahoře, popisek pod ním. Šířka popisku je pevná, sloupec se drží v okrajích mapy.
        const colW = Math.max(w, Math.min(size.nodeLabel, width - space.m * 2));
        const colLeft = Math.min(Math.max(p.x - colW / 2, space.m), width - space.m - colW);
        return (
          <SettleIn
            key={n.lesson.id}
            at={plan ? (i > plan.ci ? -1 : plan.at(i)) : null}
            fadeAt={plan ? plan.at(plan.ci) ?? 0 : 0}
            style={{ position: 'absolute', left: colLeft, width: colW, top: p.y - p.size / 2, zIndex: selected?.id === n.lesson.id ? 2 : 0 }}
          >
            <View pointerEvents="box-none" style={{ marginLeft: p.x - w / 2 - colLeft, width: w }}>
            {n.lesson.isBoss ? (
              <BarbellBoss
                state={state} accessibilityLabel={label} onPress={() => onNodePress(n, state)}
                shakeKey={shakes[n.lesson.id]} unlocking={unlocking} onUnlocked={onUnlocked}
              />
            ) : (
              <PlateNode
                kg={n.lesson.plateKg} size={p.size} state={state} accessibilityLabel={label} flightId={n.lesson.id}
                onPress={() => onNodePress(n, state)} shakeKey={shakes[n.lesson.id]}
                unlocking={unlocking} onUnlocked={onUnlocked}
                spinOut={state === 'current' ? plateSpin : undefined}
                onSpinStart={state === 'current' && reactions ? onSpinStart : undefined}
                justCompleted={isPrev && frame.prevCheck === 'draw'} checkHidden={isPrev && frame.prevCheck === 'hidden'}
                // Úvodní sled: tečky kotouče se rozsvítí spirálou s jeho usazením.
                intro={plan && i <= plan.ci ? plan.at(i) ?? undefined : undefined}
              />
            )}
            </View>
            <NodeLabel
              node={n}
              state={state}
              minutes={minutesOf[n.lesson.id] ?? 1}
              bossAfter={n.section.nodes.filter((m) => !m.lesson.isBoss).length}
            />
          </SettleIn>
        );
      })}

      {spot && reactions ? (
        // Hratelná opička (fáze 3): ťuknutí, podržení a pohled. Plocha jen 56 pt nad horní hranou kotouče;
        // zbytek kotouče (tap = lekce, tah = roztočení) zůstává volný.
        <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, top: 0 }, mascotStyle]}>
          <ReactiveMascot
            reactions={reactions} seated={seated} spin={plateSpin} scrollLook={scrollLook} idleContext={seated ? 'map' : 'default'}
            stage={stats.stage} cosmetics={cosmetics} mood={mood} size="S" hop={false} breathe={!seated}
            onTap={onMascotTap}
          />
          {/* Nástup/odchod a výměnu textu řídí motion obal; po vypršení repliky se odchod dopřehraje. */}
          <LineBubbleMotion
            text={line}
            arrowX={spot.x - lineLeft}
            style={{ position: 'absolute', bottom: '100%', left: lineLeft - (spot.x - MASCOT / 2), width: lineW }}
          />
        </Animated.View>
      ) : spot ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, mascotStyle]}>
          {/* Na uzlu dýchá prstenec, ne opička (§3.1); vedle uzlu (smutná, boss) dech zůstává. */}
          {seated ? (
            // Sedí na kotouči: dvě vrstvy se stejnou kotvou, kotouč je pod oběma (spec §2.7 z-order).
            <View pointerEvents="none" style={{ width: MASCOT, height: MASCOT }}>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
                <MonkeyBack stage={stats.stage} cosmetics={cosmetics} mood={mood} size="S" hop={false} breathe={false} />
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
                <MonkeyFront stage={stats.stage} cosmetics={cosmetics} mood={mood} size="S" hop={false} breathe={false} />
              </View>
            </View>
          ) : (
            <Mascot stage={stats.stage} cosmetics={cosmetics} mood={mood} size="S" hop={false} breathe />
          )}
        </Animated.View>
      ) : null}

      {selectedNode && selectedPos ? (
        <NodePopover
          key={selectedNode.lesson.id}
          title={selectedNode.lesson.title}
          minutes={minutesOf[selectedNode.lesson.id] ?? 1}
          exerciseCount={selectedNode.exerciseCount}
          xp={selectedNode.xp}
          state={shownState(selectedNode)}
          anchor={{ x: selectedPos.x, y: selectedPos.y, h: selectedPos.size }}
          above={selected?.above ?? false}
          mapWidth={width}
          mapHeight={height}
          onStart={() => { setSelected(null); onOpenLesson(selectedNode.lesson.id); }}
          onClose={() => setSelected(null)}
        />
      ) : null}
      </Animated.View>
    </IntentScrollView>
    </AmbientClock>
  );
}

const center = { textAlign: 'center' as const };
/** Oddělovač položek popisku uzlu (shodný s `copy.map.nodeInfo`) a nezlomitelná mezera uvnitř položky. */
const SEP = ' · ';
const JOIN = ' · ';
const nbsp = (s: string) => s.replace(/ /g, ' ');

/** Popisek pod uzlem (tabulka stavů). Metadata z dat: počet cviků, `estMinutes`, XP.
 *  current = název `headline` + metadata + „+N XP“ (akci nese plovoucí pilulka obrazovky a tap na kotouč);
 *  locked = název a metadata `caption muted`; done = jen název `caption muted`; boss = „Boss sekce“ + podmínka. */
function NodeLabel({ node, state, minutes, bossAfter }: {
  node: MapNode; state: NodeState; minutes: number; bossAfter: number;
}) {
  // Nezlomitelné mezery uvnitř položek (jako `xpBreakdownLabel`): mono je širší a na 390 pt se popisek zalomí,
  // tak ať se zalomí jen mezi položkami („4 CVIKY · 3 MIN“ / „+20 XP“), nikdy „+20“ a „XP“ zvlášť.
  const items = [...copy.map.nodeInfo(node.exerciseCount, minutes).split(SEP), copy.map.xpGain(node.xp)].map(nbsp);
  const info = items.slice(0, -1).join(JOIN);
  // XP na vlastním řádku: mono je široká a „… · +20 XP“ se na telefonu zalamovalo náhodně (QA, uživatel).
  const xp = items[items.length - 1];
  const meta = (
    <>
      <Text variant="telemetry" tone="muted" numberOfLines={1} style={center}>{info}</Text>
      <Text variant="telemetry" tone="muted" numberOfLines={1} style={center}>{xp}</Text>
    </>
  );
  const current = state === 'current';
  const isBoss = node.lesson.isBoss;
  let lines: ReactNode;
  if (isBoss && state !== 'done') {
    lines = (
      <>
        <Text variant="headline" style={center}>{copy.map.bossTitle}</Text>
        {state === 'locked' ? <Text variant="telemetry" tone="muted" style={center}>{copy.map.bossUnlock(bossAfter)}</Text> : meta}
      </>
    );
  } else if (current) {
    lines = (
      <>
        <Text variant="headline" numberOfLines={2} style={center}>{node.lesson.title}</Text>
        {meta}
      </>
    );
  } else if (state === 'locked') {
    lines = (
      <>
        <Text variant="caption" tone="muted" numberOfLines={1} style={center}>{node.lesson.title}</Text>
        <Text variant="telemetry" tone="muted" numberOfLines={1} style={center}>{info}</Text>
      </>
    );
  } else {
    lines = <Text variant="caption" tone="muted" numberOfLines={1} style={center}>{isBoss ? copy.map.bossTitle : node.lesson.title}</Text>;
  }
  return (
    <View pointerEvents="box-none" style={{ marginTop: LABEL_GAP, alignItems: 'center' }}>
      {lines}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Usazení uzlu v úvodním sledu. `at` = ms dopadu shora (kotouč spadne o 28 pt a dosedne pružinou
 *  `motion.settle`, fyzický prvek), `-1` = uzel pod aktuálním se jen prolne (`motion.enter`) v okamžiku
 *  usazení aktuálního, `null` = bez animace. Omezený pohyb: všechny jedním prolnutím 200 ms.
 *  Uzel je klepnutelný od prvního snímku (animace interakci neblokuje). */
function SettleIn({ at, fadeAt, style, children }: { at: number | null; fadeAt: number; style: object; children: ReactNode }) {
  const { reduced } = useMotionSafe();
  const [anim] = useState(at);
  const t = useSharedValue(anim === null ? 1 : 0);
  useEffect(() => {
    if (anim === null) return;
    if (reduced) t.value = withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never });
    else if (anim < 0) t.value = withDelay(fadeAt, withTiming(1, motion.enter));
    else t.value = withDelay(anim, withSpring(1, motion.settle));
    // Rozhodne se jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const drop = reduced || (anim ?? 0) < 0 ? 0 : T.map.plateDrop;
  const a = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 1.8),
    transform: [{ translateY: -(1 - t.value) * drop }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** Závoj: popover je modální vrstva, sousední uzly a opice pod ním záměrně ustoupí.
 *  Prolne se stejným presetem jako popover (motion.ui, 180 ms), takže oba naběhnou spolu.
 *  Tap funguje hned od mountu, průhlednost interakci neblokuje. */
function Scrim({ width, height, color, onPress }: { width: number; height: number; color: string; onPress(): void }) {
  const o = useSharedValue(0);
  useEffect(() => { o.value = withTiming(1, motion.ui); }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={copy.map.closePopover}
      onPress={onPress}
      style={[{ position: 'absolute', left: 0, top: 0, width, height, backgroundColor: color, zIndex: 1 }, style]}
    />
  );
}

/** Sezónní textura mapy: 4px tečky po 24 pt. */
function DotTexture({ width, height, color }: { width: number; height: number; color: string }) {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <Pattern id="map-texture" width={TEXTURE_STEP} height={TEXTURE_STEP} patternUnits="userSpaceOnUse">
          <Circle cx={TEXTURE_STEP / 2} cy={TEXTURE_STEP / 2} r={2} fill={color} />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill="url(#map-texture)" />
    </Svg>
  );
}
