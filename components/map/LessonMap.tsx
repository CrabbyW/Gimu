import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import type { LessonPathView, MapNode } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { CosmeticSlot, MascotStage, Mood } from '@/types';
import { BarbellBoss } from './BarbellBoss';
import { BOSS_SIZE, layoutNodes, popoverSide, type NodePosition } from './geometry';
import { NodePopover } from './NodePopover';
import { PathLine } from './PathLine';
import { PlateNode } from './PlateNode';
import { HAPPY_MS, UNLOCK_STEPS, findUnlockPair, unlockFrame, type UnlockPhase } from './unlockSequence';

const MASCOT = MASCOT_SIZES.S;
const MASCOT_GAP = 16;
const HOP_LIFT = -24;
const HOP_MS = 360;
const SECTION_LABEL_OFFSET = 32;
const POPOVER_ROOM = 220; // odhad výšky popoveru (i se zavírací ikonou) pro volbu strany
const TEXTURE_STEP = 24;

interface Props {
  view: LessonPathView;
  stats: { stage: MascotStage; streakBroken: boolean };
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  /** Právě odemčená lekce z route param `?unlocked=`; spustí odemykací sekvenci. */
  unlockedLessonId?: string | null;
  onOpenLesson(id: string): void;
  /** Sekvence doběhla (nebo byla přeskočena); volající smaže route param. */
  onUnlockSequenceEnd?(): void;
}

/** Opice sedí vedle uzlu na opačné straně vlny. */
const mascotSpot = (p: NodePosition, cx: number, isBoss: boolean) => {
  const half = isBoss ? BOSS_SIZE.w / 2 : p.size / 2;
  const side = p.x < cx ? 1 : -1;
  return { x: p.x + side * (half + MASCOT_GAP + MASCOT / 2), y: p.y };
};

export function LessonMap({ view, stats, cosmetics, unlockedLessonId = null, onOpenLesson, onUnlockSequenceEnd }: Props) {
  const { c, space, seasonal } = useTheme();
  const { reduced } = useMotionSafe();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cx = width / 2;
  const scroll = useRef<ScrollView>(null);
  const [viewportH, setViewportH] = useState(0);
  const scrollY = useRef(0);

  const flat = useMemo(() => view.sections.flatMap((s) => s.nodes.map((n) => ({ ...n, section: s }))), [view]);
  const layout = useMemo(
    () => layoutNodes(flat.map((n) => ({ id: n.lesson.id, plateKg: n.lesson.plateKg, isBoss: n.lesson.isBoss })), width),
    [flat, width],
  );
  const height = layout.height + insets.bottom;
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
  // S omezeným pohybem se sekvence nepřehrává: rovnou konečný stav.
  const frame = unlockFrame(pair && !reduced ? phase : null);
  const endRef = useRef(onUnlockSequenceEnd);
  useLayoutEffect(() => { endRef.current = onUnlockSequenceEnd; });

  const scrollToNode = useCallback((id: string, animated: boolean) => {
    const p = posOf(id);
    if (p && viewportH > 0) scroll.current?.scrollTo({ y: Math.max(0, p.y - viewportH * 0.4), animated });
  }, [posOf, viewportH]);

  // Parametr bez platného páru: neznámá nebo už dokončená lekce se jen smaže. Zamčená znamená,
  // že mapa ještě ukazuje data před dokončením lekce; počká se na nová.
  const unlockedState = flat.find((n) => n.lesson.id === unlockedLessonId)?.state;
  const stale = unlockedLessonId !== null && !pair && unlockedState !== 'locked';
  useEffect(() => { if (stale) endRef.current?.(); }, [stale]);

  useEffect(() => {
    if (!pairKey) return;
    if (reduced) {
      // Omezený pohyb: konečný stav (viz frame) + haptika.
      haptics.unlock();
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
      scrollToNode(view.currentLessonId, true);
    }
  }, [pair, reduced, phase, viewportH, scrollToNode, view.currentLessonId]);

  // --- Opice ---
  const mascotNodeId = pair ? (frame.mascotOn === 'prev' ? pair.prevId : pair.nextId) : view.currentLessonId;
  const mascotNode = flat.find((n) => n.lesson.id === mascotNodeId);
  const mascotPos = mascotNode ? posOf(mascotNode.lesson.id) : undefined;
  const spot = mascotPos && mascotNode ? mascotSpot(mascotPos, cx, mascotNode.lesson.isBoss) : null;
  const mx = useSharedValue(spot?.x ?? 0);
  const my = useSharedValue(spot?.y ?? 0);
  const lift = useSharedValue(0);
  const hopping = pair !== null && !reduced && phase === 5;
  // Fáze 5 trvá HAPPY_MS: po celou dobu skoku a doskoku má opice radost.
  const mood: Mood = hopping ? 'happy' : stats.streakBroken ? 'sad' : 'idle';
  useEffect(() => {
    if (!spot) return;
    if (!hopping) { mx.value = spot.x; my.value = spot.y; return; }
    // Fáze 5: skok po oblouku na nový uzel, pak radost a konec sekvence.
    // Přesun po oblouku v timingu (pružina na 112 pt dráze přestřelí přes cílový uzel);
    // pérování odměny nese doskok: zvednutí o 24 pt a dopad na pružině motion.hop.
    const travel = { duration: HOP_MS, easing: motion.reveal.easing };
    mx.value = withTiming(spot.x, travel);
    my.value = withTiming(spot.y, travel);
    lift.value = withSequence(withTiming(HOP_LIFT, { duration: HOP_MS / 2, easing: motion.ui.easing }), withSpring(0, motion.hop));
    const t = setTimeout(() => {
      advance(6);
      endRef.current?.();
    }, HAPPY_MS);
    return () => clearTimeout(t);
    // Spouští se změnou cílové pozice nebo začátkem skoku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.x, spot?.y, hopping]);
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: mx.value - MASCOT / 2 }, { translateY: my.value - MASCOT / 2 + lift.value }],
  }));

  // --- Popover a zatřesení ---
  const [selected, setSelected] = useState<{ id: string; above: boolean } | null>(null);
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const onNodePress = (n: MapNode, shown: NodeState) => {
    const p = posOf(n.lesson.id);
    // Dokončený uzel nahoru (nepřekryje aktuální uzel ani opici), jinak dolů; podle místa ve výřezu.
    const above = p
      ? popoverSide({
        done: shown === 'done', nodeTop: p.y - p.size / 2, nodeBottom: p.y + p.size / 2,
        viewportTop: scrollY.current, viewportBottom: scrollY.current + viewportH, room: POPOVER_ROOM,
      }) === 'above'
      : false;
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
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: seasonal.mapBase }}
      contentContainerStyle={{ height }}
      onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={32}
    >
      {seasonal.mapTexture ? <DotTexture width={width} height={height} color={seasonal.mapTexture} /> : null}
      <PathLine width={width} height={height} positions={layout.positions} reached={reached} drawing={drawing} />

      {selected ? (
        <Scrim width={width} height={height} color={c.scrim} onPress={() => setSelected(null)} />
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
            style={{ position: 'absolute', left: space.m, top: p.y - p.size / 2 - SECTION_LABEL_OFFSET }}
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
        return (
          <View key={n.lesson.id} style={{ position: 'absolute', left: p.x - w / 2, top: p.y - p.size / 2, zIndex: selected?.id === n.lesson.id ? 2 : 0 }}>
            {n.lesson.isBoss ? (
              <BarbellBoss
                state={state} accessibilityLabel={label} onPress={() => onNodePress(n, state)}
                shakeKey={shakes[n.lesson.id]} unlocking={unlocking} onUnlocked={onUnlocked}
              />
            ) : (
              <PlateNode
                kg={n.lesson.plateKg} size={p.size} state={state} accessibilityLabel={label}
                onPress={() => onNodePress(n, state)} shakeKey={shakes[n.lesson.id]}
                unlocking={unlocking} onUnlocked={onUnlocked}
                justCompleted={isPrev && frame.prevCheck === 'draw'} checkHidden={isPrev && frame.prevCheck === 'hidden'}
              />
            )}
          </View>
        );
      })}

      {spot ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, mascotStyle]}>
          <Mascot stage={stats.stage} cosmetics={cosmetics} mood={mood} size="S" />
        </Animated.View>
      ) : null}

      {selectedNode && selectedPos ? (
        <NodePopover
          key={selectedNode.lesson.id}
          title={selectedNode.lesson.title}
          kg={selectedNode.lesson.plateKg}
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
    </ScrollView>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
