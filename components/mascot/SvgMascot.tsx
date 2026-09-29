import { useEffect, useId, useRef } from 'react';
import Animated, {
  cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { MascotStage, Mood } from '@/types';
import { MASCOT_COLORS, mascotInk } from './palette';
import { resolveMascotSize, type MascotProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const IDLE_MOUTH = 'M88 108 Q100 112 112 108';
const HAPPY_MOUTH = 'M86 104 Q100 122 114 104 Z';
const EYE_RY_OPEN = 6;
const EYE_RY_CLOSED = 0.6;
// Odlesk v oku zmizí dřív, než se oko zavře, jinak by při mrknutí visel ve vzduchu.
const CATCHLIGHT_FADE: [number, number] = [2.5, 5];
const BLINK_MIN_MS = 3000;
const BLINK_SPREAD_MS = 3000;
// Dech (spec §8): scaleY 1 → 1.02 za 2.4 s tam a zpět. Střed škálování je uprostřed plátna,
// takže o kolik se spodní hrana roztažením posune dolů (1 % strany), o tolik ji translateY vrátí:
// opice stojí na místě a dýchá nahoru.
const BREATH_HALF_MS = 1200;
const BREATH_SCALE = 0.02;
const BREATH_LIFT = BREATH_SCALE / 2;
// Poskočení ve zlomcích strany plátna, aby se animace nemusela restartovat při změně velikosti.
const HOP_HEIGHT = 0.12;
const HOP_RISE_MS = 140;

type PlanAFace = 'idle' | 'happy';
// plán B: celebrate dostane ruce nahoru a opakované poskoky, sad svěšené uši, pohled dolů a pomalejší dech.
const PLAN_A_FACE: Record<Mood, PlanAFace> = { idle: 'idle', happy: 'happy', celebrate: 'happy', sad: 'idle' };

/** Geometrická opice stage 1 (spec §8). Kosmetické vrstvy na kotvách z `anchors.ts` doplní plán B. */
export function SvgMascot({ stage, mood, size, accessibilityLabel }: MascotProps) {
  const { c } = useTheme();
  const { reduced } = useMotionSafe();
  const px = resolveMascotSize(size);
  const happy = PLAN_A_FACE[mood] === 'happy';
  const ink = mascotInk(c);
  // ID ořezů musí být v dokumentu unikátní (na webu je víc opic v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const clip = { body: `mascot-body-${uid}`, head: `mascot-head-${uid}` };
  useStageFallbackWarning(stage);

  // Dýchání celého těla.
  const breath = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(breath);
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(withTiming(1, { duration: BREATH_HALF_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [reduced, breath]);

  // Mrknutí v náhodném intervalu 3–6 s; JS časovač spouští sekvenci na UI vlákně.
  const eyeRy = useSharedValue(EYE_RY_OPEN);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(eyeRy);
      eyeRy.value = EYE_RY_OPEN;
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        eyeRy.value = withSequence(withTiming(EYE_RY_CLOSED, { duration: 70 }), withTiming(EYE_RY_OPEN, { duration: 110 }));
        schedule();
      }, BLINK_MIN_MS + Math.random() * BLINK_SPREAD_MS);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      cancelAnimation(eyeRy);
    };
  }, [reduced, eyeRy]);

  // Radost: poskočení pružinou (herní odměna, spec §6.8) při každé změně nálady na radostnou
  // (i happy → celebrate). Omezení pohybu se čte přes ref: jeho přepnutí samo skok nespustí.
  // Při omezení pohybu bez skoku, úsměv zůstává.
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (PLAN_A_FACE[mood] !== 'happy') return;
    hop.value = reducedRef.current ? 0 : withSequence(withTiming(-HOP_HEIGHT, { duration: HOP_RISE_MS }), withSpring(0, motion.hop));
  }, [mood, hop]);

  // Úsměv: crossfade dvou tvarů pusy.
  const smile = useSharedValue(happy ? 1 : 0);
  useEffect(() => {
    smile.value = withTiming(happy ? 1 : 0, motion.ui);
  }, [happy, smile]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (hop.value - breath.value * BREATH_LIFT) * px },
      { scaleY: 1 + breath.value * BREATH_SCALE },
    ],
  }));
  const eyeLeftProps = useAnimatedProps(() => ({ ry: eyeRy.value }));
  const eyeRightProps = useAnimatedProps(() => ({ ry: eyeRy.value }));
  const catchLeftProps = useAnimatedProps(() => ({ opacity: interpolate(eyeRy.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP) }));
  const catchRightProps = useAnimatedProps(() => ({ opacity: interpolate(eyeRy.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP) }));
  const idleMouthProps = useAnimatedProps(() => ({ opacity: 1 - smile.value }));
  const happyMouthProps = useAnimatedProps(() => ({ opacity: smile.value }));

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? copy.mascot.label[mood]}
      style={[{ width: px, height: px }, bodyStyle]}
    >
      <Svg width={px} height={px} viewBox="0 0 200 200">
        <Defs>
          <ClipPath id={clip.body}>
            <Rect x={72} y={122} width={56} height={52} rx={26} />
          </ClipPath>
          <ClipPath id={clip.head}>
            <Circle cx={100} cy={80} r={54} />
          </ClipPath>
        </Defs>

        {/* Hmotu dává jen plochý stín srsti dole: nohy, paže a srpky pod hlavou, tělem a čenichem. Bez gradientu. */}
        <Circle cx={82} cy={176} r={12} fill={MASCOT_COLORS.furShade} />
        <Circle cx={118} cy={176} r={12} fill={MASCOT_COLORS.furShade} />
        {/* Ramena 4 jednotky uvnitř obrysu těla: horní konec paže zajede pod tělo, bez mezery. */}
        <Rect x={67} y={128} width={14} height={40} rx={7} fill={MASCOT_COLORS.furShade} transform="rotate(18 74 128)" />
        <Rect x={119} y={128} width={14} height={40} rx={7} fill={MASCOT_COLORS.furShade} transform="rotate(-18 126 128)" />
        <Rect x={72} y={122} width={56} height={52} rx={26} fill={MASCOT_COLORS.furShade} />
        <Rect x={72} y={116} width={56} height={52} rx={26} fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.body})`} />
        <Ellipse cx={100} cy={146} rx={14} ry={12} fill={MASCOT_COLORS.face} />

        <Circle cx={46} cy={78} r={18} fill={MASCOT_COLORS.fur} />
        <Circle cx={154} cy={78} r={18} fill={MASCOT_COLORS.fur} />
        <Circle cx={46} cy={78} r={9} fill={MASCOT_COLORS.face} />
        <Circle cx={154} cy={78} r={9} fill={MASCOT_COLORS.face} />
        <Circle cx={100} cy={80} r={54} fill={MASCOT_COLORS.furShade} />
        <Circle cx={100} cy={75} r={54} fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.head})`} />

        <Ellipse cx={100} cy={105} rx={34} ry={22} fill={MASCOT_COLORS.furShade} />
        <Circle cx={82} cy={78} r={24} fill={MASCOT_COLORS.face} />
        <Circle cx={118} cy={78} r={24} fill={MASCOT_COLORS.face} />
        <Ellipse cx={100} cy={102} rx={34} ry={22} fill={MASCOT_COLORS.face} />

        <AnimatedEllipse cx={84} cy={78} rx={5} ry={EYE_RY_OPEN} fill={ink} animatedProps={eyeLeftProps} />
        <AnimatedEllipse cx={116} cy={78} rx={5} ry={EYE_RY_OPEN} fill={ink} animatedProps={eyeRightProps} />
        <AnimatedCircle cx={86} cy={75} r={1.6} fill={MASCOT_COLORS.face} animatedProps={catchLeftProps} />
        <AnimatedCircle cx={118} cy={75} r={1.6} fill={MASCOT_COLORS.face} animatedProps={catchRightProps} />
        <Circle cx={95} cy={96} r={2} fill={ink} />
        <Circle cx={105} cy={96} r={2} fill={ink} />

        <AnimatedPath d={IDLE_MOUTH} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" animatedProps={idleMouthProps} />
        <AnimatedPath d={HAPPY_MOUTH} fill={ink} animatedProps={happyMouthProps} />
      </Svg>
    </Animated.View>
  );
}

/** Stage 2 a 3 zatím kreslí geometrii stage 1; ve vývoji na to jednou za mount upozorní. */
function useStageFallbackWarning(stage: MascotStage) {
  const warned = useRef(false);
  useEffect(() => {
    if (!__DEV__ || stage === 1 || warned.current) return;
    warned.current = true;
    console.warn(`[Mascot] stage ${stage} zatím nemá vlastní geometrii, kreslím stage 1 (plán B).`);
  }, [stage]);
}
