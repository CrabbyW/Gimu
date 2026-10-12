import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, ReduceMotion, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { copy } from '@/data/copy';
import { V2 } from '@/components/mascot/monkeyGeometry';
import { feedback } from '@/lib/feedback';
import { ease, splash as S } from '@/lib/motion';
import { dots } from '@/theme';
import { dark } from '@/theme/palettes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const NEVER = ReduceMotion.Never;
const T = dots.splash;

export interface AnimatedSplashProps {
  /** Appka je připravená (fonty + hydratace store). Splash se prolne pryč až po dohrání A ready. */
  ready?: boolean;
  /** Konec: ťuknutí (skip) nebo dohrání + prolnutí. */
  onDone: () => void;
  /** První layout: rodič tu schová nativní splash (stejný obraz na stejném místě → žádný skok). */
  onShown?: () => void;
}

/**
 * Animovaný splash (plán vast-snuggling-sunbeam, krok 3). Převezme nativní splash: dark base a hlava opice
 * (`dots.splash.head` pt = `imageWidth` v app.json, výřez `dots.splash.view` = `assets/splash-icon.png`)
 * uprostřed okna. Pak se kolem hlavy po jedné rozsvítí 12 teček (horní v akcentu `live`, jako póza 1
 * reference), opice mrkne (jemná haptika) a celé se prolne do appky. Vždy dark paleta: navazuje na nativní
 * splash bez ohledu na režim appky. Omezený pohyb: hlava bez kruhu a jen rychlé prolnutí po ready.
 * Všechno na UI vlákně z jedné hodnoty postupu (`lit`); stav appky na splashi nezávisí.
 */
export function AnimatedSplash({ ready = true, onDone, onShown }: AnimatedSplashProps) {
  const reduced = useReducedMotion();
  const lit = useSharedValue(0);
  const blink = useSharedValue(1);
  const shown = useSharedValue(1);
  const grow = useSharedValue(1);
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

  // Choreografie: kruh teček → mrknutí + haptika → dohráno.
  useEffect(() => {
    if (!started || reduced) return;
    lit.set(withTiming(T.count, { duration: S.dotStepMs * (T.count - 1) + S.dotInMs, easing: Easing.linear, reduceMotion: NEVER }));
    const blinkAt = setTimeout(() => {
      feedback('introPulse');
      blink.set(withSequence(
        withTiming(0, { duration: S.blinkCloseMs, easing: ease.out, reduceMotion: NEVER }),
        withTiming(1, { duration: S.blinkOpenMs, easing: ease.out, reduceMotion: NEVER }),
      ));
    }, S.blinkAt);
    const playedAt = setTimeout(() => setPlayed(true), S.fadeAt);
    return () => { clearTimeout(blinkAt); clearTimeout(playedAt); };
  }, [started, reduced, lit, blink]);

  const isPlayed = started && (played || reduced);
  const leaving = isPlayed && ready;
  useEffect(() => {
    if (!leaving) return;
    const ms = reduced ? S.reducedFadeMs : S.fadeMs;
    shown.set(withTiming(0, { duration: ms, easing: ease.exit, reduceMotion: NEVER }));
    if (!reduced) grow.set(withTiming(S.exitScale, { duration: ms, easing: ease.exit, reduceMotion: NEVER }));
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
  }, [leaving, reduced, shown, grow, finish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const artStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.get() }] }));

  // Hlava: stejný výřez a velikost jako nativní obraz. Kruh: větší plátno se stejným středem a měřítkem.
  const [vx, vy, side] = T.view;
  const unit = T.head / side;
  const ringSide = 2 * (T.ringR + T.dotR + 1);
  const cx = V2.head.cx, cy = V2.head.cy;
  return (
    <Animated.View testID="splash-layer" pointerEvents={leaving ? 'none' : 'auto'} style={[StyleSheet.absoluteFill, rootStyle]} onLayout={onLayout}>
      <Pressable
        testID="splash"
        onPress={finish}
        accessible
        accessibilityRole="button"
        accessibilityLabel={copy.intro.label}
        accessibilityHint={copy.intro.hint}
        style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: dark.base }]}
      >
        <Animated.View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={[styles.center, { width: ringSide * unit, height: ringSide * unit }, artStyle]}
        >
          {reduced ? null : (
            <Svg testID="splash-ring" width={ringSide * unit} height={ringSide * unit} viewBox={`${cx - ringSide / 2} ${cy - ringSide / 2} ${ringSide} ${ringSide}`} style={StyleSheet.absoluteFill}>
              {Array.from({ length: T.count }, (_, i) => <RingDot key={i} i={i} lit={lit} />)}
            </Svg>
          )}
          <View testID="splash-head" style={{ width: T.head, height: T.head }}>
            <Svg width={T.head} height={T.head} viewBox={`${vx} ${vy} ${side} ${side}`}>
              <Circle cx={cx - V2.ears.dx} cy={cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
              <Circle cx={cx + V2.ears.dx} cy={cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
              <Circle cx={cx} cy={cy} r={V2.head.r} fill={dark.mascotFur} />
              <Path d={V2.face} fill={dark.mascotFace} />
              <Eye x={cx - V2.eyes.dx} blink={blink} />
              <Eye x={cx + V2.eyes.dx} blink={blink} />
            </Svg>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Tečka kruhu: `i` = pořadí od 12 hodin po směru; rozsvítí se, když postup `lit` přejde přes `i`. */
function RingDot({ i, lit }: { i: number; lit: SharedValue<number> }) {
  const a = (i / T.count) * Math.PI * 2 - Math.PI / 2;
  const props = useAnimatedProps(() => ({ opacity: Math.min(1, Math.max(0, lit.get() - i)) }));
  return (
    <AnimatedCircle
      testID="splash-dot"
      cx={V2.head.cx + Math.cos(a) * T.ringR}
      cy={V2.head.cy + Math.sin(a) * T.ringR}
      r={T.dotR}
      fill={i === 0 ? dark.live : dark.mascotProp}
      opacity={0}
      animatedProps={props}
    />
  );
}

/** Oko: mrknutí = výška elipsy (`blink` 1 otevřené → 0 zavřené, minimum = tenká linka). */
function Eye({ x, blink }: { x: number; blink: SharedValue<number> }) {
  const RY = V2.eyes.ry;
  const props = useAnimatedProps(() => ({ ry: Math.max(1, RY * blink.get()) }));
  return <AnimatedEllipse cx={x} cy={V2.eyes.cy} rx={V2.eyes.rx} ry={RY} fill={dark.mascotEye} animatedProps={props} />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
