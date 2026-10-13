import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { splashDone, splashShown } from '@/lib/introHop';
import { ease, splash as S } from '@/lib/motion';
import { SPLASH_GLYPHS, GLYPH_GAP, GLYPH_H, GLYPH_W, fitCell, textDots } from '@/logic/dotGlyphs';
import { dots as dotTokens } from '@/theme';
import { dark } from '@/theme/palettes';

const NEVER = ReduceMotion.Never;
const T = dotTokens.splash;
const WORD = 'OPICE';
/** Písmeno s živou tečkou (I) a jeho řádek (tečka nahoře). */
const LIVE_LETTER = 2;

export interface AnimatedSplashProps {
  /** Appka je připravená (fonty + hydratace store). Splash odjede do mapy až po dohrání A ready. */
  ready?: boolean;
  /** Konec: ťuknutí (skip) nebo dohrání + ústup do mapy. */
  onDone: () => void;
  /** První layout: rodič tu schová nativní splash (ten je jen černý = stejný podklad, žádný skok). */
  onShown?: () => void;
}

/**
 * Splash 03 „Tečkový nápis“ (nahradil A „Probuzení“, 2026-10-13). Černá base, uprostřed nápis OPICE z teček jako
 * displej Nothing: zhasnutá matrice je vidět slabě, svítící tečky naskočí sloupec po sloupci zleva. Tečka nad I
 * zčervená (`live`, jediná barva) a mrkne (lehká haptika), nápis se smrští a odjede na místo nadpisu mapy,
 * podklad se mezitím prolne do mapy pod ním. Opice ve splashi není (2026-10-13): po konci skočí na mapě
 * k aktuální lekci (`lib/introHop`, `motion.splashHop`).
 * RN View pro tečky (bez Skia: splash běží dřív, než je na webu CanvasKit). Ve workletech jen čísla a sdílené hodnoty.
 * Omezený pohyb: statický nápis s živou tečkou, jen prolnutí `reducedFadeMs`.
 */
export function AnimatedSplash({ ready = true, onDone, onShown }: AnimatedSplashProps) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const layout = useMemo(() => textDots(WORD, SPLASH_GLYPHS), []);
  const cell = fitCell(layout.cols, width * T.widthFrac, T.maxCell);
  const d = Math.max(1, Math.round(cell * T.dotFrac));
  const cols = useMemo(() => {
    const byCol = Array.from({ length: layout.cols }, () => [] as number[]);
    for (const p of layout.dots) byCol[p.x]?.push(p.y);
    return byCol;
  }, [layout]);
  const liveDot = layout.dots.find((p) => p.li === LIVE_LETTER && p.y === 0);
  const full = layout.cols + S.colFade;

  const scan = useSharedValue(reduced ? full : 0);
  const live = useSharedValue(reduced ? 1 : 0);
  const shrink = useSharedValue(0);
  const wordOut = useSharedValue(0);
  const bgOut = useSharedValue(0);
  const [started, setStarted] = useState(false);
  const [played, setPlayed] = useState(false);
  const doneRef = useRef(false);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    splashDone();
    onDone();
  }, [onDone]);
  const onLayout = useCallback(() => {
    if (started) return;
    setStarted(true);
    splashShown();
    onShown?.();
  }, [started, onShown]);

  // Choreografie: sken → živá tečka se rozsvítí a mrkne + haptika → dohráno.
  useEffect(() => {
    if (!started || reduced) return;
    const t = (duration: number) => ({ duration, easing: ease.out, reduceMotion: NEVER });
    scan.set(withTiming(full, { duration: full * S.colStepMs, reduceMotion: NEVER }));
    live.set(withDelay(S.liveAt, withSequence(
      withTiming(1, t(S.liveMs)),
      withTiming(S.blinkLow, { duration: S.blinkMs / 2, easing: ease.exit, reduceMotion: NEVER }),
      withTiming(1, t(S.blinkMs / 2)),
    )));
    const liveAt = setTimeout(() => feedback('introPulse'), S.liveAt);
    const playedAt = setTimeout(() => setPlayed(true), S.exitAt);
    return () => { clearTimeout(liveAt); clearTimeout(playedAt); };
  }, [started, reduced, full, scan, live]);

  const isPlayed = started && (played || reduced);
  const leaving = isPlayed && ready;
  useEffect(() => {
    if (!leaving) return;
    const ms = reduced ? S.reducedFadeMs : S.exitMs;
    const out = (duration: number) => withTiming(1, { duration, easing: ease.exit, reduceMotion: NEVER });
    if (reduced) {
      bgOut.set(out(ms)); wordOut.set(out(ms));
    } else {
      shrink.set(withTiming(1, { duration: ms, easing: ease.inOut, reduceMotion: NEVER }));
      bgOut.set(withDelay(ms * S.bgFrom, out(ms * (1 - S.bgFrom))));
      wordOut.set(withDelay(ms / 2, out(ms / 2)));
    }
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
  }, [leaving, reduced, shrink, bgOut, wordOut, finish]);

  // Geometrie: nápis uprostřed displeje.
  const wordW = cell * layout.cols, wordH = cell * layout.rows;
  const left = (width - wordW) / 2;
  const top = (height - wordH) / 2;
  // Cíl ústupu: levá horní hrana nápisu na místě nadpisu mapy, výška = výška nadpisu.
  const sc = T.titleH / Math.max(1, wordH);
  const tx = T.titleX - left - (wordW * (1 - sc)) / 2;
  const ty = (initialWindowMetrics?.insets.top ?? 0) + T.titleY - top - (wordH * (1 - sc)) / 2;

  const bgStyle = useAnimatedStyle(() => ({ opacity: 1 - bgOut.get() }));
  const artStyle = useAnimatedStyle(() => {
    const k = shrink.get();
    return { opacity: 1 - wordOut.get(), transform: [{ translateX: tx * k }, { translateY: ty * k }, { scale: 1 + (sc - 1) * k }] };
  });
  const liveStyle = useAnimatedStyle(() => ({ opacity: live.get() }));

  const dim = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let li = 0; li < WORD.length; li++) {
      for (let x = 0; x < GLYPH_W; x++) for (let y = 0; y < GLYPH_H; y++) out.push({ x: li * (GLYPH_W + GLYPH_GAP) + x, y });
    }
    return out;
  }, []);
  const dot = (x: number, y: number, color: string, key: string | number, testID?: string) => (
    <View key={key} testID={testID} style={{ position: 'absolute', left: x * cell + (cell - d) / 2, top: y * cell + (cell - d) / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />
  );

  return (
    <Animated.View testID="splash-layer" pointerEvents={leaving ? 'none' : 'auto'} style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark.base }, bgStyle]} />
      <Pressable
        testID="splash"
        onPress={finish}
        accessible
        accessibilityRole="button"
        accessibilityLabel={copy.intro.label}
        accessibilityHint={copy.intro.hint}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          testID="splash-word"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[{ position: 'absolute', left, top, width: wordW, height: wordH }, artStyle]}
        >
          {dim.map((p, i) => dot(p.x, p.y, dark.dotOff, i))}
          {cols.map((ys, col) => (ys.length === 0 ? null : (
            <LitColumn key={col} col={col} scan={scan}>
              {ys.map((y) => dot(col, y, dark.text, y, 'splash-dot-on'))}
            </LitColumn>
          )))}
          {liveDot ? (
            <Animated.View testID="splash-live" style={[StyleSheet.absoluteFill, liveStyle]} pointerEvents="none">
              {dot(liveDot.x, liveDot.y, dark.live, 'live')}
            </Animated.View>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Svítící tečky jednoho sloupce nad zhasnutou matricí; opacita podle čela skenu (jen čísla a sdílená hodnota). */
function LitColumn({ col, scan, children }: { col: number; scan: SharedValue<number>; children: ReactNode }) {
  const F = S.colFade;
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, (scan.get() - col) / F)) }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}
