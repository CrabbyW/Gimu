import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  ReduceMotion, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { copy } from '@/data/copy';
import { V2 } from '@/components/mascot/monkeyGeometry';
import { feedback } from '@/lib/feedback';
import { ease, splash as S } from '@/lib/motion';
import { SPLASH_GLYPHS, GLYPH_GAP, GLYPH_H, GLYPH_W, fitCell, textDots } from '@/logic/dotGlyphs';
import { dots as dotTokens } from '@/theme';
import { dark } from '@/theme/palettes';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
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
 * displej Nothing: zhasnutá matrice je vidět slabě, svítící tečky naskočí sloupec po sloupci zleva. Zpoza „O“
 * vykoukne hlava opice (geometrie V2), tečka nad I zčervená (`live`, jediná barva), opice mrkne (lehká haptika)
 * a nápis se smrští a odjede na místo nadpisu mapy, podklad se mezitím prolne do mapy pod ním.
 * RN View pro tečky (bez Skia: splash běží dřív, než je na webu CanvasKit). Ve workletech jen čísla a sdílené hodnoty.
 * Omezený pohyb: statický nápis s opicí, jen prolnutí `reducedFadeMs`.
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
  const peek = useSharedValue(reduced ? 1 : 0);
  const live = useSharedValue(reduced ? 1 : 0);
  const open = useSharedValue(1);
  const shrink = useSharedValue(0);
  const headOut = useSharedValue(0);
  const wordOut = useSharedValue(0);
  const bgOut = useSharedValue(0);
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

  // Choreografie: sken → opice vykoukne → živá tečka → mrknutí + haptika → dohráno.
  useEffect(() => {
    if (!started || reduced) return;
    const t = (duration: number) => ({ duration, easing: ease.out, reduceMotion: NEVER });
    scan.set(withTiming(full, { duration: full * S.colStepMs, reduceMotion: NEVER }));
    peek.set(withDelay(S.peekAt, withTiming(1, t(S.peekMs))));
    live.set(withDelay(S.liveAt, withTiming(1, t(S.liveMs))));
    open.set(withDelay(S.blinkAt, withSequence(
      withTiming(S.eyesClosed, { duration: S.blinkMs / 2, easing: ease.exit, reduceMotion: NEVER }),
      withTiming(1, t(S.blinkMs / 2)),
    )));
    const blinkAt = setTimeout(() => feedback('introPulse'), S.blinkAt);
    const playedAt = setTimeout(() => setPlayed(true), S.exitAt);
    return () => { clearTimeout(blinkAt); clearTimeout(playedAt); };
  }, [started, reduced, full, scan, peek, live, open]);

  const isPlayed = started && (played || reduced);
  const leaving = isPlayed && ready;
  useEffect(() => {
    if (!leaving) return;
    const ms = reduced ? S.reducedFadeMs : S.exitMs;
    const out = (duration: number) => withTiming(1, { duration, easing: ease.exit, reduceMotion: NEVER });
    if (reduced) {
      bgOut.set(out(ms)); wordOut.set(out(ms)); headOut.set(out(ms));
    } else {
      shrink.set(withTiming(1, { duration: ms, easing: ease.inOut, reduceMotion: NEVER }));
      headOut.set(out(ms / 2));
      bgOut.set(withDelay(ms * S.bgFrom, out(ms * (1 - S.bgFrom))));
      wordOut.set(withDelay(ms / 2, out(ms / 2)));
    }
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
  }, [leaving, reduced, shrink, headOut, bgOut, wordOut, finish]);

  // Geometrie: nápis uprostřed (skupina s hlavou nad O vycentrovaná na výšku), hlava zpoza horní řady O.
  const wordW = cell * layout.cols, wordH = cell * layout.rows;
  const [vx, vy, vw, vh] = T.peekView;
  const peekW = Math.min(T.peekMax, wordW * T.peekFrac);
  const peekH = (peekW * vh) / vw;
  const sink = T.peekSink * cell;
  const left = (width - wordW) / 2;
  const top = (height - wordH + peekH - sink) / 2;
  // Cíl ústupu: levá horní hrana nápisu na místě nadpisu mapy, výška = výška nadpisu.
  const sc = T.titleH / Math.max(1, wordH);
  const tx = T.titleX - left - (wordW * (1 - sc)) / 2;
  const ty = (initialWindowMetrics?.insets.top ?? 0) + T.titleY - top - (wordH * (1 - sc)) / 2;

  const bgStyle = useAnimatedStyle(() => ({ opacity: 1 - bgOut.get() }));
  const artStyle = useAnimatedStyle(() => {
    const k = shrink.get();
    return { opacity: 1 - wordOut.get(), transform: [{ translateX: tx * k }, { translateY: ty * k }, { scale: 1 + (sc - 1) * k }] };
  });
  const headStyle = useAnimatedStyle(() => ({ opacity: 1 - headOut.get(), transform: [{ translateY: (1 - peek.get()) * peekH }] }));
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
  const cx = V2.head.cx;

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
          {/* Hlava za nápisem: výřez s bradou pod horní řadou O, opice z něj vyjede nahoru. */}
          <View style={{ position: 'absolute', left: 2.5 * cell - peekW / 2, top: sink - peekH, width: peekW, height: peekH, overflow: 'hidden' }}>
            <Animated.View testID="splash-head" style={[{ width: peekW, height: peekH }, headStyle]}>
              <Svg width={peekW} height={peekH} viewBox={`${vx} ${vy} ${vw} ${vh}`}>
                <Circle cx={cx - V2.ears.dx} cy={V2.head.cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
                <Circle cx={cx + V2.ears.dx} cy={V2.head.cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
                <Circle cx={cx} cy={V2.head.cy} r={V2.head.r} fill={dark.mascotFur} />
                <Path d={V2.face} fill={dark.mascotFace} />
                <Eye x={cx - V2.eyes.dx} open={open} />
                <Eye x={cx + V2.eyes.dx} open={open} />
              </Svg>
            </Animated.View>
          </View>
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

/** Oko: výška elipsy `open` (1 = otevřené, `eyesClosed` = zavřené při mrknutí). */
function Eye({ x, open }: { x: number; open: SharedValue<number> }) {
  const RY = V2.eyes.ry;
  const props = useAnimatedProps(() => ({ ry: RY * open.get() }));
  return <AnimatedEllipse cx={x} cy={V2.eyes.cy} rx={V2.eyes.rx} ry={RY} fill={dark.mascotEye} animatedProps={props} />;
}
