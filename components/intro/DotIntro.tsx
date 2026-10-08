import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming,
  ReduceMotion, type SharedValue,
} from 'react-native-reanimated';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { dotIntro, dotIntroPlayedMs, ease } from '@/lib/motion';
import { fitCell, textDots } from '@/logic/dotGlyphs';
import { dots as dotTokens, useTheme } from '@/theme';

export interface DotIntroProps {
  /** Statický náhled: postup rozsvícení 0–1 zleva doprava (sloupec `col` svítí, když `col < progress × cols`).
   *  Bez něj intro hraje vlastní choreografii (`dotIntro` v lib/motion). */
  progress?: number;
  /** Appka je připravená (fonty + data). Intro se prolne pryč až po dohrání A ready; do té doby drží nápis. */
  ready?: boolean;
  /** Konec intra: ťuknutí (skip, hned) nebo dohrání + prolnutí. */
  onDone: () => void;
  /** Intro je vykreslené (první layout): rodič tu schová nativní splash. */
  onShown?: () => void;
  /** Text nápisu; výchozí OPICE. */
  text?: string;
}

const NEVER = ReduceMotion.Never;

/**
 * Logo moment při studeném startu: mřížka teček s nápisem OPICE uprostřed podkladu.
 * RN View, ne Skia: intro se ukáže hned při startu, kdy na webu ještě není načtený CanvasKit (8 MB wasm),
 * a nezabírá žádné z ≤ 12 WebGL pláten. Tečky jsou seskupené po sloupcích (29 View); rozsvícení zleva doprava
 * = 29 animovaných opacit vrstvy rozsvícených teček nad zhasnutými (UI vlákno, žádný re-render po snímcích).
 */
export function DotIntro({ progress, ready = true, onDone, onShown, text = 'OPICE' }: DotIntroProps) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const layout = useMemo(() => textDots(text), [text]);
  const cell = fitCell(layout.cols, width * dotTokens.intro.widthFrac, dotTokens.intro.maxCell);
  const d = Math.max(1, Math.round(cell * dotTokens.intro.dotFrac));
  const columns = useMemo(() => {
    const lit = Array.from({ length: layout.cols }, () => new Set<number>());
    for (const p of layout.dots) lit[p.x]?.add(p.y);
    return lit;
  }, [layout]);
  const isStatic = progress !== undefined;
  const litCols = (progress ?? 1) * layout.cols;

  // Čelo skenu v jednotkách sloupců: −colFadeCols (vše zhasnuté) → cols (vše svítí).
  const front = useSharedValue(isStatic || reduced ? layout.cols : -dotIntro.colFadeCols);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(1);
  const shown = useSharedValue(1);
  const [started, setStarted] = useState(false);
  const [played, setPlayed] = useState(false);
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const onLayout = useCallback(() => {
    if (started) return;
    setStarted(true);
    onShown?.();
  }, [started, onShown]);

  // Choreografie: sken → pulz + haptika. Stav appky na ní nezávisí (běží souběžně s načítáním).
  useEffect(() => {
    if (!started || isStatic) return;
    if (reduced) return;
    front.set(withTiming(layout.cols, { duration: dotIntro.scanMs, easing: ease.out, reduceMotion: NEVER }));
    const pulseAt = setTimeout(() => {
      feedback('introPulse');
      pulse.set(withSequence(
        withTiming(dotIntro.pulseScale, { duration: dotIntro.pulseMs, easing: ease.out, reduceMotion: NEVER }),
        withTiming(1, { duration: dotIntro.pulseMs, easing: ease.exit, reduceMotion: NEVER }),
      ));
    }, dotIntro.scanMs);
    const playedAt = setTimeout(() => setPlayed(true), dotIntroPlayedMs(false));
    return () => { clearTimeout(pulseAt); clearTimeout(playedAt); };
  }, [started, isStatic, reduced, layout.cols, front, pulse]);

  // Omezený pohyb nemá choreografii: dohráno hned po zobrazení.
  const isPlayed = started && (played || reduced);
  // Při prolnutí pryč dotyky nebere (appka pod ním je hned ovladatelná).
  const leaving = isPlayed && ready && !isStatic;

  // Dohráno, ale appka ještě není ready: nápis drží a jemně dýchá (bez omezeného pohybu).
  useEffect(() => {
    if (!isPlayed || ready || reduced) return;
    glow.set(withRepeat(withTiming(dotIntro.holdLow, { duration: dotIntro.holdHalfMs, easing: ease.sine, reduceMotion: NEVER }), -1, true));
    return () => {
      cancelAnimation(glow);
      glow.set(withTiming(1, { duration: dotIntro.pulseMs, easing: ease.out, reduceMotion: NEVER }));
    };
  }, [isPlayed, ready, reduced, glow]);

  // Dohráno a ready: prolnutí do appky, onDone po jeho konci.
  useEffect(() => {
    if (!leaving) return;
    const ms = reduced ? dotIntro.reducedFadeMs : dotIntro.fadeMs;
    shown.set(withTiming(0, { duration: ms, easing: ease.exit, reduceMotion: NEVER }));
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
  }, [leaving, reduced, shown, finish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: glow.get(), transform: [{ scale: pulse.get() }] }));

  return (
    <Animated.View
      testID="dot-intro-layer"
      pointerEvents={leaving ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, rootStyle]}
      onLayout={onLayout}
    >
      <Pressable
        testID="dot-intro"
        onPress={finish}
        accessible
        accessibilityRole="button"
        accessibilityLabel={copy.intro.label}
        accessibilityHint={copy.intro.hint}
        style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.base }]}
      >
        <Animated.View
          testID="intro-word"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[styles.row, { width: cell * layout.cols, height: cell * layout.rows }, wordStyle]}
        >
          {columns.map((ys, col) => (
            <View key={col} testID={`intro-col-${col}`} style={{ width: cell }}>
              {Array.from({ length: layout.rows }, (_, y) => (
                <View key={y} style={[styles.center, { width: cell, height: cell }]}>
                  <View
                    testID={isStatic && ys.has(y) ? 'intro-dot-on' : undefined}
                    style={{
                      width: d, height: d, borderRadius: d / 2,
                      backgroundColor: isStatic && ys.has(y) && col < litCols ? c.text : c.dotOff,
                    }}
                  />
                </View>
              ))}
              {isStatic ? null : <LitColumn col={col} ys={ys} rows={layout.rows} cell={cell} d={d} color={c.text} front={front} />}
            </View>
          ))}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

interface LitColumnProps { col: number; ys: Set<number>; rows: number; cell: number; d: number; color: string; front: SharedValue<number> }

/** Rozsvícené tečky jednoho sloupce nad zhasnutými; opacita podle čela skenu (ve workletu jen čísla a sdílená hodnota). */
function LitColumn({ col, ys, rows, cell, d, color, front }: LitColumnProps) {
  const fade = dotIntro.colFadeCols;
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (front.get() - col) / fade + 1)) }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {Array.from({ length: rows }, (_, y) => (
        <View key={y} style={[styles.center, { width: cell, height: cell }]}>
          {ys.has(y) ? <View testID="intro-dot-on" style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }} /> : null}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
});
