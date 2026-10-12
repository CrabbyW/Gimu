import { useEffect, useRef } from 'react';
import Animated, {
  cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { ease, motion, spring, useMotionSafe } from '@/lib/motion';
import { MASCOT_POSES, resolvePose, type MascotPose } from '@/logic/mascotPoses';
import { useTheme, type Colors } from '@/theme';
import type { Mood } from '@/types';
import { armPath, EYE_DROP, EYE_RY, handWorld, legPath, V2 } from './monkeyGeometry';
import { useReactionMotion } from './reactionMotion';
import { resolveMascotSize, type MascotProps } from './types';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);

const EYE_RY_OPEN = 6;
const EYE_RY_CLOSED = 0.6;
const BLINK_MIN_MS = 3000;
const BLINK_SPREAD_MS = 3000;
// Dech: scaleY 1 → 1.02 za 2.4 s tam a zpět, spodní hrana zůstává na místě.
const BREATH_HALF_MS = 1200;
const BREATH_SCALE = 0.02;
const BREATH_HALF_MS_SAD = 1800;
const BREATH_SCALE_SAD = 0.012;
const HOP_HEIGHT = 0.12;
const GAZE_DOWN = 3;
const EYE_RY_MIN = EYE_RY.closed;

type Face = 'idle' | 'happy' | 'sad';
type MoodPose = { face: Face; armsUp: boolean; earsDown: boolean; breathHalfMs: number; hopRepeat: boolean };
/** Pohybový charakter nálady (dech, poskoky). Kresbu pózy nese `logic/mascotPoses` (`poseForMood`). */
export const MOOD_POSE: Record<Mood, MoodPose> = {
  idle: { face: 'idle', armsUp: false, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: false },
  happy: { face: 'happy', armsUp: false, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: false },
  celebrate: { face: 'happy', armsUp: true, earsDown: false, breathHalfMs: BREATH_HALF_MS, hopRepeat: true },
  sad: { face: 'sad', armsUp: false, earsDown: true, breathHalfMs: BREATH_HALF_MS_SAD, hopRepeat: false },
};

/** `all` = celá opice, `back`/`front` = dvě vrstvy pro sezení na kotouči (nohy vpředu přes hranu kotouče). */
type Layer = 'all' | 'back' | 'front';

/** Opice v2: plná silueta (reference opice-v2-pozy). Póza z `logic/mascotPoses`. */
export function SvgMascot(props: MascotProps) {
  return <MascotSvg {...props} layer="all" />;
}
/** Zadní vrstva sedící opice (vše kromě nohou). Nese popisek pro čtečku. */
export function MonkeyBack(props: MascotProps) {
  return <MascotSvg {...props} layer="back" />;
}
/** Přední vrstva sedící opice: jen nohy přes hranu kotouče. Vždy dekorativní. */
export function MonkeyFront(props: MascotProps) {
  return <MascotSvg {...props} decorative layer="front" />;
}

/** Barvy opice v2 z theme: v dark negativ (světlá silueta), v light originál (černá silueta). */
export const monkeyInk = (c: Colors) => ({ fur: c.mascotFur, face: c.mascotFace, eye: c.mascotEye, prop: c.mascotProp, live: c.live });

function MascotSvg({
  mood: baseMood, size, accessibilityLabel, decorative, breathe: breatheProp = true, hop: hopProp = true,
  reaction, gaze, spin, idle, scrollLook, pose: poseProp, layer,
}: MascotProps & { layer: Layer }) {
  const { c } = useTheme();
  const ink = monkeyInk(c);
  const drawBack = layer !== 'front';
  const drawLegs = layer !== 'back';
  const { reduced } = useMotionSafe();
  const px = resolveMascotSize(size);
  const {
    override: ov, ref: rootRef, lift, squash: rSquash, stretch, roll, tilt, eyeClose, droop: rDroop, pupilX, pupilY, headProps: headMatrix,
  } = useReactionMotion({ reaction, reduced, gaze, spin, idle, scrollLook, neck: V2.neck });
  const mood = ov?.mood ?? baseMood;
  const sleeping = ov?.sleeping === true;
  const breathe = breatheProp || sleeping;
  const hopEnabled = hopProp && !ov?.mood;
  const moodPose = MOOD_POSE[mood];
  const poseId = resolvePose({ pose: poseProp, mood, reaction: ov && reaction ? reaction.id : null });
  const pose: MascotPose = MASCOT_POSES[poseId];
  const breathScale = sleeping ? motion.reactions.sleep.breathScale : moodPose.face === 'sad' ? BREATH_SCALE_SAD : BREATH_SCALE;
  const breathHalfMs = sleeping ? motion.reactions.sleep.breathHalfMs : moodPose.breathHalfMs;

  // Dech celého těla (motion-agent ho může přeladit; struktura zůstává).
  const breath = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(breath);
    breath.set(0);
    if (reduced || !breathe) return;
    breath.set(withRepeat(withTiming(1, { duration: breathHalfMs, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(breath);
  }, [reduced, breathe, breath, breathHalfMs]);

  // Mrknutí v náhodném intervalu 3–6 s.
  const eyeRy = useSharedValue(EYE_RY_OPEN);
  useEffect(() => {
    if (reduced) { cancelAnimation(eyeRy); eyeRy.set(EYE_RY_OPEN); return; }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        eyeRy.set(withSequence(withTiming(EYE_RY_CLOSED, { duration: 70 }), withTiming(EYE_RY_OPEN, { duration: 110 })));
        schedule();
      }, BLINK_MIN_MS + Math.random() * BLINK_SPREAD_MS);
    };
    schedule();
    return () => { clearTimeout(timer); cancelAnimation(eyeRy); };
  }, [reduced, eyeRy]);

  // Poskoky nálady (happy jednou, celebrate opakovaně), beze změny proti v1.
  const prevMood = useRef<Mood | null>(null);
  const hop = useSharedValue(0);
  const squash = useSharedValue(0);
  useEffect(() => {
    const changed = prevMood.current !== baseMood;
    prevMood.current = baseMood;
    const p = MOOD_POSE[baseMood];
    cancelAnimation(hop);
    cancelAnimation(squash);
    const h = motion.hop;
    const jump = () => withSequence(
      withTiming(0, { duration: h.crouchMs }),
      withTiming(-HOP_HEIGHT, { duration: h.riseMs, easing: ease.out }),
      withTiming(0, { duration: h.fallMs, easing: ease.gravity }),
    );
    const squashJump = () => withSequence(
      withTiming(1, { duration: h.crouchMs, easing: ease.out }),
      withTiming(0, { duration: h.riseMs, easing: ease.out }),
      withTiming(0, { duration: h.fallMs }),
      withTiming(1, { duration: h.landMs, easing: ease.out }),
      withTiming(0, { duration: h.recoverMs, easing: ease.out }),
    );
    if (reduced) { hop.set(0); squash.set(0); }
    else if (!hopEnabled) { hop.set(withTiming(0, motion.moodShift)); squash.set(withTiming(0, motion.moodShift)); }
    else if (p.hopRepeat) {
      const rest = motion.celebrateRestMs + h.landMs + h.recoverMs;
      hop.set(withRepeat(withSequence(jump(), withDelay(rest, withTiming(0, { duration: 0 }))), -1));
      squash.set(withRepeat(withSequence(squashJump(), withDelay(motion.celebrateRestMs, withTiming(0, { duration: 0 }))), -1));
    } else if (p.face === 'happy' && changed) { hop.set(jump()); squash.set(squashJump()); }
    else { hop.set(withTiming(0, motion.moodShift)); squash.set(withTiming(0, motion.moodShift)); }
  }, [baseMood, reduced, hopEnabled, hop, squash]);
  useEffect(() => () => { cancelAnimation(hop); cancelAnimation(squash); }, [hop, squash]);

  // Přepnutí výrazu: krátké přikrčení a mrknutí.
  const bob = useSharedValue(0);
  const blendFace = useRef<Face>(moodPose.face);
  useEffect(() => {
    if (blendFace.current === moodPose.face) return;
    blendFace.current = moodPose.face;
    if (reduced) return;
    const m = motion.mascotIdle.moodBlend;
    bob.set(withSequence(withTiming(m.bob, { duration: m.inMs, easing: ease.out }), withSpring(0, spring.sal)));
    eyeRy.set(withSequence(withTiming(EYE_RY_CLOSED, { duration: m.closeMs }), withTiming(EYE_RY_OPEN, { duration: m.openMs })));
  }, [moodPose.face, reduced, bob, eyeRy]);

  const bodyStyle = useAnimatedStyle(() => {
    const sy = 1 + breath.value * breathScale - squash.value * motion.hop.squash - rSquash.value + stretch.value - bob.value;
    const sx = 1 + (squash.value * motion.hop.squash + rSquash.value) * 0.6;
    return {
      transform: [
        { translateY: (hop.value + lift.value - (sy - 1) / 2) * px },
        { translateY: px / 2 }, { rotate: `${tilt.value}deg` }, { translateY: -px / 2 },
        { rotate: `${roll.value}deg` },
        { scaleY: sy },
        { scaleX: sx },
      ],
    };
  });

  // Oči: základ z pózy (otevřené / přivřené / zavřené) × mrknutí × zavření reakcí; pupily = posun celé elipsy.
  const P = motion.reactions.gaze;
  const baseRy = EYE_RY[pose.eyes];
  const eyeCy = V2.eyes.cy + EYE_DROP[pose.eyes];
  const PX = P.pupilX, PY = P.pupilY;
  const cxL = V2.head.cx - V2.eyes.dx, cxR = V2.head.cx + V2.eyes.dx;
  const eyeL = useAnimatedProps(() => {
    const close = Math.min(1, Math.max(0, eyeClose.value));
    const blink = Math.max(0, Math.min(1, eyeRy.value / EYE_RY_OPEN));
    return {
      ry: Math.max(EYE_RY_MIN, baseRy * blink * (1 - close) + EYE_RY_MIN * close),
      cx: cxL + pupilX.value * PX,
      cy: eyeCy + Math.min(1, rDroop.value) * GAZE_DOWN + pupilY.value * PY,
    };
  });
  const eyeR = useAnimatedProps(() => {
    const close = Math.min(1, Math.max(0, eyeClose.value));
    const blink = Math.max(0, Math.min(1, eyeRy.value / EYE_RY_OPEN));
    return {
      ry: Math.max(EYE_RY_MIN, baseRy * blink * (1 - close) + EYE_RY_MIN * close),
      cx: cxR + pupilX.value * PX,
      cy: eyeCy + Math.min(1, rDroop.value) * GAZE_DOWN + pupilY.value * PY,
    };
  });
  const headProps = useAnimatedProps(() => headMatrix.value);

  const bodyT = `translate(${pose.dx} ${pose.dy}) rotate(${pose.body} ${V2.hip.x} ${V2.hip.y})`;
  const headT = `translate(${pose.head.dx} ${pose.head.dy}) rotate(${pose.head.tilt} ${V2.neck.x} ${V2.neck.y})`;
  const { head, ears, torso, eyes } = V2;
  const limb = (d: string, w: number, key: string) => (
    <Path key={key} d={d} stroke={ink.fur} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );

  return (
    <Animated.View
      ref={rootRef}
      {...(decorative
        ? { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: accessibilityLabel ?? copy.mascot.label[mood] })}
      style={[{ width: px, height: px }, bodyStyle]}
    >
      <Svg width={px} height={px} viewBox="0 0 200 200">
        {drawBack ? <PoseExtras pose={pose} ink={ink} /> : null}
        <G transform={bodyT}>
          {/* Nohy: vlastní vrstva s pivotem v kyčli (sedící opice je kreslí vpředu přes hranu kotouče). */}
          {drawLegs ? (
            <G testID="mascot-legs">
              {limb(legPath(pose, -1), V2.leg.w, 'legL')}
              {limb(legPath(pose, 1), V2.leg.w, 'legR')}
            </G>
          ) : null}
          {drawBack ? (
            <>
              <Rect x={torso.x} y={torso.y} width={torso.w} height={torso.h} rx={torso.rx} fill={ink.fur} />
              {/* Paže: pivot v rameni, loket = druhý bod tahu. */}
              <G testID="mascot-arms">
                {limb(armPath(pose, -1), V2.arm.w, 'armL')}
                {limb(armPath(pose, 1), V2.arm.w, 'armR')}
              </G>
              {/* Hlava: náklon pózy kolem krku, nad ním matice reakcí (natočení, kývnutí). */}
              <G transform={headT}>
                <AnimatedG animatedProps={headProps}>
                  <Circle cx={head.cx - ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} />
                  <Circle cx={head.cx + ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} />
                  <Circle cx={head.cx} cy={head.cy} r={head.r} fill={ink.fur} />
                  <Path d={V2.face} fill={ink.face} />
                  <AnimatedEllipse cx={head.cx - eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} animatedProps={eyeL} />
                  <AnimatedEllipse cx={head.cx + eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} animatedProps={eyeR} />
                </AnimatedG>
              </G>
            </>
          ) : null}
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Tečkové doplňky pózy ve světových souřadnicích: červená tečka radosti, záblesk, Zz, hrazda. */
function PoseExtras({ pose, ink }: { pose: MascotPose; ink: ReturnType<typeof monkeyInk> }) {
  const top = V2.head.cy - V2.head.r + pose.dy + pose.head.dy;
  const nodes = [];
  if (pose.joyDot) nodes.push(<Circle key="joy" testID="mascot-joy" cx={100} cy={top - 16} r={5} fill={ink.live} />);
  if (pose.extra === 'burst') {
    // Pět krátkých paprsků z teček nad hlavou (oslava), vějíř −60…60°.
    [-60, -30, 0, 30, 60].forEach((deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      [26, 33].forEach((r, k) => {
        if (deg === 0 && k === 0) return;
        nodes.push(<Circle key={`b${deg}${k}`} cx={100 + Math.cos(a) * r} cy={top - 16 + 16 + Math.sin(a) * r} r={2} fill={ink.prop} />);
      });
    });
  }
  if (pose.extra === 'zz') {
    // Dvě „Z“ z teček, menší a větší, šikmo nad hlavou spící opice.
    const z = (x: number, y: number, s: number, key: string) => {
      const pts = [[0, 0], [1, 0], [2, 0], [1.5, 0.75], [1, 1.5], [0.5, 2.25], [0, 3], [1, 3], [2, 3]] as const;
      return pts.map(([u, v], i) => <Circle key={`${key}${i}`} cx={x + u * s} cy={y + (v * s * 2) / 3} r={s * 0.32} fill={ink.prop} />);
    };
    nodes.push(...z(140, 96, 5, 'za'), ...z(158, 66, 7, 'zb'));
  }
  if (pose.extra === 'bar') {
    const l = handWorld(pose, -1), r = handWorld(pose, 1);
    const y = Math.min(l.y, r.y) - 6;
    for (let x = 52; x <= 148; x += 8) nodes.push(<Circle key={`bar${x}`} cx={x} cy={y} r={2.6} fill={ink.prop} />);
  }
  return <G testID="mascot-extras">{nodes}</G>;
}
