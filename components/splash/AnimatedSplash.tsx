import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing, ReduceMotion, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming,
  type SharedValue, type WithTimingConfig,
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
 * Animovaný splash, směr A „Probuzení“. Nativní splash je jen dark base (`assets/splash-icon.png` je
 * průhledný), takže první snímek je černá bez skoku. Uprostřed vyroste červená tečka, z ní se po kruhu
 * rozsvítí 12 teček (horní `live`, větší), uvnitř nastoupí hlava opice (geometrie V2) se zavřenýma očima,
 * otevře je (lehká haptika) a kruh s hlavou se zmenší, ustoupí nahoru a prolne se do mapy.
 * Vždy dark paleta. Omezený pohyb: statická hlava, jen prolnutí. Všechno na UI vlákně ze sdílených hodnot.
 */
export function AnimatedSplash({ ready = true, onDone, onShown }: AnimatedSplashProps) {
  const reduced = useReducedMotion();
  const seed = useSharedValue(0);
  const lit = useSharedValue(0);
  const head = useSharedValue(0);
  const open = useSharedValue<number>(S.eyesClosed);
  const shown = useSharedValue(1);
  const away = useSharedValue(0);
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

  // Choreografie A: tečka → kruh → hlava → otevření očí + haptika → dohráno.
  useEffect(() => {
    if (!started || reduced) return;
    const t = (duration: number, easing: WithTimingConfig['easing'] = ease.out) => ({ duration, easing, reduceMotion: NEVER });
    seed.set(withSequence(
      withTiming(S.seedPeak, t(S.seedMs * 0.6)),
      withTiming(1, t(S.seedMs * 0.4)),
    ));
    lit.set(withDelay(S.ringAt, withTiming(T.count, t(S.dotStepMs * (T.count - 1) + S.dotInMs, Easing.linear))));
    head.set(withDelay(S.headAt, withTiming(1, t(S.headInMs))));
    open.set(withDelay(S.openAt, withTiming(1, t(S.openMs))));
    const openAt = setTimeout(() => feedback('introPulse'), S.openAt);
    const playedAt = setTimeout(() => setPlayed(true), S.fadeAt);
    return () => { clearTimeout(openAt); clearTimeout(playedAt); };
  }, [started, reduced, seed, lit, head, open]);

  const isPlayed = started && (played || reduced);
  const leaving = isPlayed && ready;
  useEffect(() => {
    if (!leaving) return;
    const ms = reduced ? S.reducedFadeMs : S.fadeMs;
    shown.set(withTiming(0, { duration: ms, easing: ease.exit, reduceMotion: NEVER }));
    if (!reduced) away.set(withTiming(1, { duration: ms, easing: ease.exit, reduceMotion: NEVER }));
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
  }, [leaving, reduced, shown, away, finish]);

  const X_SCALE = S.exitScale, X_Y = S.exitY, H_FROM = S.headFrom;
  const rootStyle = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: X_Y * away.get() }, { scale: 1 + (X_SCALE - 1) * away.get() }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    opacity: head.get(),
    transform: [{ scale: H_FROM + (1 - H_FROM) * head.get() }],
  }));
  const seedProps = useAnimatedProps(() => ({ r: T_SEED * seed.get() }));

  // Hlava: výřez `view` na `head` pt. Kruh: větší plátno se stejným středem a měřítkem.
  const [vx, vy, side] = T.view;
  const unit = T.head / side;
  const ringSide = 2 * (T.ringR + T.liveR + 1);
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
              <AnimatedCircle testID="splash-seed" cx={cx} cy={cy} r={0} fill={dark.live} animatedProps={seedProps} />
              {Array.from({ length: T.count }, (_, i) => <RingDot key={i} i={i} lit={lit} />)}
            </Svg>
          )}
          <Animated.View testID="splash-head" style={[{ width: T.head, height: T.head }, reduced ? null : headStyle]}>
            <Svg width={T.head} height={T.head} viewBox={`${vx} ${vy} ${side} ${side}`}>
              <Circle cx={cx - V2.ears.dx} cy={cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
              <Circle cx={cx + V2.ears.dx} cy={cy + V2.ears.dy} r={V2.ears.r} fill={dark.mascotFur} />
              <Circle cx={cx} cy={cy} r={V2.head.r} fill={dark.mascotFur} />
              <Path d={V2.face} fill={dark.mascotFace} />
              <Eye x={cx - V2.eyes.dx} open={open} reduced={reduced} />
              <Eye x={cx + V2.eyes.dx} open={open} reduced={reduced} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const T_SEED = T.seedR;

/** Tečka kruhu: `i` = pořadí od 12 hodin po směru; rozsvítí se, když postup `lit` přejde přes `i`. */
function RingDot({ i, lit }: { i: number; lit: SharedValue<number> }) {
  const a = (i / T.count) * Math.PI * 2 - Math.PI / 2;
  const props = useAnimatedProps(() => ({ opacity: Math.min(1, Math.max(0, lit.get() - i)) }));
  return (
    <AnimatedCircle
      testID="splash-dot"
      cx={V2.head.cx + Math.cos(a) * T.ringR}
      cy={V2.head.cy + Math.sin(a) * T.ringR}
      r={i === 0 ? T.liveR : T.dotR}
      fill={i === 0 ? dark.live : dark.mascotProp}
      opacity={0}
      animatedProps={props}
    />
  );
}

/** Oko: otevření = výška elipsy (`open` `eyesClosed` → 1). Omezený pohyb: rovnou otevřené. */
function Eye({ x, open, reduced }: { x: number; open: SharedValue<number>; reduced: boolean }) {
  const RY = V2.eyes.ry;
  const props = useAnimatedProps(() => ({ ry: RY * open.get() }));
  return <AnimatedEllipse cx={x} cy={V2.eyes.cy} rx={V2.eyes.rx} ry={RY} fill={dark.mascotEye} animatedProps={reduced ? undefined : props} />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
