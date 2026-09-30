import { useEffect, useId, useRef } from 'react';
import Animated, {
  type SharedValue, cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { MascotStage, Mood } from '@/types';
import { ANCHORS, type Anchor } from './anchors';
import { ArmPoseContext, layerParts, SeasonScarf, type LayerPart } from './cosmetics';
import { armPoint, STAGE_GEOMETRY, type Limb } from './geometry';
import { MASCOT_COLORS, mascotInk } from './palette';
import { resolveMascotSize, type MascotProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const IDLE_MOUTH = 'M88 108 Q100 112 112 108';
const HAPPY_MOUTH = 'M86 104 Q100 122 114 104 Z';
const SAD_MOUTH = 'M88 112 Q100 104 112 112';
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
// Smutek (spec §8 „pomalejší dech“): delší a mělčí nádech.
const BREATH_HALF_MS_SAD = 1800;
const BREATH_SCALE_SAD = 0.012;
// Poskočení ve zlomcích strany plátna, aby se animace nemusela restartovat při změně velikosti.
const HOP_HEIGHT = 0.12;
const HOP_RISE_MS = 140;
// Celebrate: paže z klidového úhlu nahoru. Brief: 180 − 20 = 160° (ruce nad hlavou, mírně od sebe).
// Kratší paže stage 1–2 by v 160° skončily za velkou hlavou (stage 1: ruka 41 od středu hlavy r 54),
// proto se úhel otevře, až ruka hlavu mine: stage 1 120°, stage 2 140° (ruce nahoru do V), stage 3 160°.
const ARMS_UP_ANGLE: Record<MascotStage, number> = { 1: 120, 2: 140, 3: 160 };
// Sad: uši o 8 dolů a 4 ven, pohled (oči a odlesky) o 3 dolů.
const EARS_DOWN_Y = 8;
const EARS_DOWN_X = 4;
const GAZE_DOWN = 3;

type Face = 'idle' | 'happy' | 'sad';
type MoodPose = { face: Face; armsUp: boolean; earsDown: boolean; breathHalfMs: number; hopRepeat: boolean };
/** Póza každé nálady (spec §8). Animace ji jen znázorňují, při omezení pohybu se nastaví staticky. */
export const MOOD_POSE: Record<Mood, MoodPose> = {
  idle: { face: 'idle', armsUp: false, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: false },
  happy: { face: 'happy', armsUp: false, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: false },
  celebrate: { face: 'happy', armsUp: true, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: true },
  sad: { face: 'sad', armsUp: false, earsDown: true, breathHalfMs: BREATH_HALF_MS_SAD, hopRepeat: false },
};

// Obličej je nakreslený v souřadnicích stage 1 (hlava r = 54 se středem 100,80) a do hlavy
// dalších stage se přenáší jako skupina se scale = r / 54.
const FACE_REF = { cx: 100, cy: 80, r: 54 };
// Světlo shora: horní vrstva srsti je posunutá nahoru a spodní srpek zůstane ve stínu.
const HEAD_LIGHT = 5;
const BODY_LIGHT = 6;
// Stage 3: biceps v 40 % délky paže, poloměr 0.6 šířky paže.
const BICEP_AT = 0.4;
const BICEP_R = 0.6;
const WINTER_SCARF_ID = 'outfit-winter-arc-scarf';

/** Geometrická opice stage 1–3 z `STAGE_GEOMETRY` (spec §8) s kosmetickými vrstvami na kotvách z `anchors.ts`. */
export function SvgMascot({ stage, mood, size, cosmetics, accessibilityLabel }: MascotProps) {
  const { c, seasonThemeId } = useTheme();
  const { reduced } = useMotionSafe();
  const px = resolveMascotSize(size);
  const pose = MOOD_POSE[mood];
  const breathScale = pose.face === 'sad' ? BREATH_SCALE_SAD : BREATH_SCALE;
  const ink = mascotInk(c);
  // ID ořezů musí být v dokumentu unikátní (na webu je víc opic v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const clip = { body: `mascot-body-${uid}`, head: `mascot-head-${uid}`, shoulders: `mascot-shoulders-${uid}` };
  const g = STAGE_GEOMETRY[stage];
  const { head, ears, torso, shoulders, legs } = g;
  const faceScale = head.r / FACE_REF.r;
  const faceTransform = `translate(${head.cx} ${head.cy}) scale(${faceScale}) translate(${-FACE_REF.cx} ${-FACE_REF.cy})`;
  const bicep = shoulders !== null;
  const anchors = ANCHORS[stage];

  // Kosmetika (spec §8): outfit → sezónní šála → accessory; neznámé id se tiše přeskočí.
  // Sezónní šála Winter Arc se kreslí vždy během sezóny, kromě případu, kdy je šála nasazená jako outfit.
  const seasonScarf: LayerPart[] =
    seasonThemeId === 'winterArc' && cosmetics.outfit !== WINTER_SCARF_ID ? [{ anchor: 'neck', z: 'front', Component: SeasonScarf }] : [];
  const layers = [...layerParts(cosmetics.outfit), ...seasonScarf, ...layerParts(cosmetics.accessory)];
  const pick = (z: LayerPart['z'], anchor: LayerPart['anchor']) => layers.filter((l) => l.z === z && l.anchor === anchor);
  const renderLayers = (ls: LayerPart[], anchor: Anchor) =>
    ls.map(({ Component }, i) => <Component key={i} anchor={anchor} stage={stage} ink={ink} />);
  const backLayers = layers.filter((l) => l.z === 'back');

  // Dýchání celého těla; smutek dýchá pomaleji a mělčeji. Střed škálování je uprostřed plátna,
  // translateY vrací spodní hranu zpět: opice stojí na místě a dýchá nahoru.
  const breath = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(breath);
    breath.value = 0;
    if (reduced) return;
    breath.value = withRepeat(withTiming(1, { duration: pose.breathHalfMs, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [reduced, breath, pose.breathHalfMs]);

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

  // Poskoky pružinou (herní odměna, spec §6.8). happy = jeden skok při změně nálady na happy,
  // celebrate = opakované poskoky s pauzou na zemi, dokud nálada trvá; změna nálady je zruší
  // a opice dosedne timingem. Při omezení pohybu bez skoků; samo přepnutí omezení skok nespustí.
  const prevMood = useRef<Mood | null>(null);
  const hop = useSharedValue(0);
  useEffect(() => {
    const changed = prevMood.current !== mood;
    prevMood.current = mood;
    const p = MOOD_POSE[mood];
    cancelAnimation(hop);
    if (reduced) {
      hop.value = 0;
    } else if (p.hopRepeat) {
      hop.value = withRepeat(
        withSequence(
          withTiming(-HOP_HEIGHT, { duration: HOP_RISE_MS }),
          withSpring(0, motion.hop),
          withDelay(motion.celebrateRestMs, withTiming(0, { duration: 0 })),
        ),
        -1,
      );
    } else if (p.face === 'happy' && changed) {
      hop.value = withSequence(withTiming(-HOP_HEIGHT, { duration: HOP_RISE_MS }), withSpring(0, motion.hop));
    } else {
      hop.value = withTiming(0, motion.moodShift);
    }
  }, [mood, reduced, hop]);
  useEffect(() => () => cancelAnimation(hop), [hop]);

  // Paže nahoru (celebrate), timing: pozornost nese poskok.
  const arms = useSharedValue(pose.armsUp ? 1 : 0);
  useEffect(() => {
    const to = pose.armsUp ? 1 : 0;
    arms.value = reduced ? to : withTiming(to, motion.armsRaise);
  }, [pose.armsUp, reduced, arms]);

  // Smutek: uši dolů a ven, pohled dolů.
  const droop = useSharedValue(pose.earsDown ? 1 : 0);
  useEffect(() => {
    const to = pose.earsDown ? 1 : 0;
    droop.value = reduced ? to : withTiming(to, motion.moodShift);
  }, [pose.earsDown, reduced, droop]);

  // Tři pusy (idle, happy, sad) jako crossfade přes opacity. Do smutku a z něj pomaleji.
  const mouthIdle = useSharedValue(pose.face === 'idle' ? 1 : 0);
  const mouthHappy = useSharedValue(pose.face === 'happy' ? 1 : 0);
  const mouthSad = useSharedValue(pose.face === 'sad' ? 1 : 0);
  const prevFace = useRef<Face>(pose.face);
  useEffect(() => {
    const cfg = reduced ? { duration: 0 } : pose.face === 'sad' || prevFace.current === 'sad' ? motion.moodShift : motion.ui;
    prevFace.current = pose.face;
    mouthIdle.value = withTiming(pose.face === 'idle' ? 1 : 0, cfg);
    mouthHappy.value = withTiming(pose.face === 'happy' ? 1 : 0, cfg);
    mouthSad.value = withTiming(pose.face === 'sad' ? 1 : 0, cfg);
  }, [pose.face, reduced, mouthIdle, mouthHappy, mouthSad]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (hop.value - (breath.value * breathScale) / 2) * px },
      { scaleY: 1 + breath.value * breathScale },
    ],
  }));
  const eyeLeftProps = useAnimatedProps(() => ({ ry: eyeRy.value, cy: 78 + droop.value * GAZE_DOWN }));
  const eyeRightProps = useAnimatedProps(() => ({ ry: eyeRy.value, cy: 78 + droop.value * GAZE_DOWN }));
  const catchLeftProps = useAnimatedProps(() => ({
    opacity: interpolate(eyeRy.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP),
    cy: 75 + droop.value * GAZE_DOWN,
  }));
  const catchRightProps = useAnimatedProps(() => ({
    opacity: interpolate(eyeRy.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP),
    cy: 75 + droop.value * GAZE_DOWN,
  }));
  const earLeftProps = useAnimatedProps(() => ({ cx: head.cx - ears.dx - droop.value * EARS_DOWN_X, cy: head.cy + ears.dy + droop.value * EARS_DOWN_Y }));
  const earRightProps = useAnimatedProps(() => ({ cx: head.cx + ears.dx + droop.value * EARS_DOWN_X, cy: head.cy + ears.dy + droop.value * EARS_DOWN_Y }));
  const idleMouthProps = useAnimatedProps(() => ({ opacity: mouthIdle.value }));
  const happyMouthProps = useAnimatedProps(() => ({ opacity: mouthHappy.value }));
  const sadMouthProps = useAnimatedProps(() => ({ opacity: mouthSad.value }));

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
            <Rect x={torso.x} y={torso.y} width={torso.w} height={torso.h} rx={torso.rx} />
          </ClipPath>
          <ClipPath id={clip.head}>
            <Circle cx={head.cx} cy={head.cy} r={head.r} />
          </ClipPath>
          {shoulders && (
            <ClipPath id={clip.shoulders}>
              <Rect x={shoulders.x} y={shoulders.y} width={shoulders.w} height={shoulders.h} rx={shoulders.rx} />
            </ClipPath>
          )}
        </Defs>

        {/* Zadní vrstvy kosmetiky (kapuce) leží za celou opicí. */}
        {backLayers.map(({ Component, anchor }, i) => (
          <Component key={i} anchor={anchor === 'hands' ? anchors.handL : anchors[anchor]} stage={stage} ink={ink} />
        ))}

        {/* Hmotu dává jen plochý stín srsti dole: nohy, paže a srpky pod hlavou, tělem a čenichem. Bez gradientu. */}
        <Circle cx={100 - legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
        <Circle cx={100 + legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
        {/* Ramena paží leží uvnitř obrysu těla: horní konec paže zajede pod tělo, bez mezery. */}
        <Arm limb={g.armL} side={-1} bicep={bicep} raise={arms} upAngle={ARMS_UP_ANGLE[stage]} />
        <Arm limb={g.armR} side={1} bicep={bicep} raise={arms} upAngle={ARMS_UP_ANGLE[stage]} />
        {/* Vrstvy na rukou jedou po ose paže se stejnou pózou, takže se zvedají s celebrate. */}
        <ArmPoseContext.Provider value={{ raise: arms, upAngle: ARMS_UP_ANGLE[stage] }}>
          {renderLayers(pick('front', 'hands'), anchors.handL)}
        </ArmPoseContext.Provider>
        {shoulders && (
          <>
            <Rect x={shoulders.x} y={shoulders.y} width={shoulders.w} height={shoulders.h} rx={shoulders.rx} fill={MASCOT_COLORS.furShade} />
            <Rect
              x={shoulders.x} y={shoulders.y - shoulders.h / 2} width={shoulders.w} height={shoulders.h} rx={shoulders.rx}
              fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.shoulders})`}
            />
          </>
        )}
        <Rect x={torso.x} y={torso.y} width={torso.w} height={torso.h} rx={torso.rx} fill={MASCOT_COLORS.furShade} />
        <Rect
          x={torso.x} y={torso.y - BODY_LIGHT} width={torso.w} height={torso.h} rx={torso.rx}
          fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.body})`}
        />
        <Ellipse cx={100} cy={torso.y + torso.h / 2 - 2} rx={torso.w / 4} ry={torso.h * 0.23} fill={MASCOT_COLORS.face} />
        <G clipPath={`url(#${clip.body})`}>{renderLayers(pick('front', 'body'), anchors.body)}</G>

        <AnimatedCircle cx={head.cx - ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={MASCOT_COLORS.fur} animatedProps={earLeftProps} />
        <AnimatedCircle cx={head.cx + ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={MASCOT_COLORS.fur} animatedProps={earRightProps} />
        <AnimatedCircle cx={head.cx - ears.dx} cy={head.cy + ears.dy} r={ears.r / 2} fill={MASCOT_COLORS.face} animatedProps={earLeftProps} />
        <AnimatedCircle cx={head.cx + ears.dx} cy={head.cy + ears.dy} r={ears.r / 2} fill={MASCOT_COLORS.face} animatedProps={earRightProps} />
        <Circle cx={head.cx} cy={head.cy} r={head.r} fill={MASCOT_COLORS.furShade} />
        <Circle cx={head.cx} cy={head.cy - HEAD_LIGHT * faceScale} r={head.r} fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.head})`} />

        <G transform={faceTransform}>
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
          <AnimatedPath d={SAD_MOUTH} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" animatedProps={sadMouthProps} />
        </G>

        {renderLayers(pick('front', 'neck'), anchors.neck)}
        <G clipPath={`url(#${clip.head})`}>{renderLayers(pick('front', 'head'), anchors.head)}</G>
      </Svg>
    </Animated.View>
  );
}

/**
 * Paže otočená kolem ramene; `side` −1 = levá (vrchol se vychýlí doleva), +1 = pravá.
 * Kreslí se jako tah s kulatými konci (= Rect s rx = w/2 otočený o úhel), aby šel úhel animovat
 * přes `d` na UI vlákně: `raise` 0 → 1 otočí paži z `limb.angle` na `upAngle`.
 */
function Arm({ limb, side, bicep, raise, upAngle }: { limb: Limb; side: -1 | 1; bicep: boolean; raise: SharedValue<number>; upAngle: number }) {
  const at = (t: number, deg: number) => {
    'worklet';
    return armPoint(limb, side, t, deg);
  };
  // `raise.value` se čte přímo v updateru: reanimated sleduje závislosti z jeho closure.
  const armProps = useAnimatedProps(() => {
    const deg = limb.angle + (upAngle - limb.angle) * raise.value;
    const a = at(limb.w / 2, deg);
    const b = at(limb.h - limb.w / 2, deg);
    return { d: `M${a.x} ${a.y} L${b.x} ${b.y}` };
  });
  const bicepProps = useAnimatedProps(() => {
    const p = at(limb.h * BICEP_AT, limb.angle + (upAngle - limb.angle) * raise.value);
    return { cx: p.x, cy: p.y };
  });
  return (
    <>
      <AnimatedPath stroke={MASCOT_COLORS.furShade} strokeWidth={limb.w} strokeLinecap="round" fill="none" animatedProps={armProps} />
      {bicep && <AnimatedCircle r={limb.w * BICEP_R} fill={MASCOT_COLORS.furShade} animatedProps={bicepProps} />}
    </>
  );
}
