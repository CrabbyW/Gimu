import { useEffect, useId, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { ease, mascotPose as MP, motion, spring, useMotionSafe } from '@/lib/motion';
import { groupMatrix, LIFE_CLOCK_MS, limbD, swayDeg, swayPivotY, zzFrame } from '@/lib/poseMotion';
import { actBody, actSway, GROW_DOTS, GROW_R, growDot, handAt, TRAIN_FOR, towelDot, trainLift } from '@/lib/repertoireMotion';
import { MASCOT_POSES, poseForIdle, resolvePose, type MascotPose, type MascotPoseId } from '@/logic/mascotPoses';
import { useTheme, type Colors } from '@/theme';
import type { Mood } from '@/types';
import { armPath, EYE_DROP, EYE_RY, handWorld, legPath, PROP, V2 } from './monkeyGeometry';
import { bustShape, propsBack, propsFace, propsFront } from './PoseProps';
import { PropMotionContext } from './PropMotion';
import { useReactionMotion } from './reactionMotion';
import { useActPlayer } from './useActPlayer';
import { usePoseMotion } from './usePoseMotion';
import { resolveMascotSize, type MascotProps } from './types';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const IS_WEB = Platform.OS === 'web';
/** Hrazda visu (osa houpání) ve viewBoxu: nad rukama pózy `hang`, stejně jako ji kreslí `PoseExtras`. */
const HANG_BAR_Y = Math.min(handWorld(MASCOT_POSES.hang, -1).y, handWorld(MASCOT_POSES.hang, 1).y) - 6;
/** Pivot balancování ve stojce: dlaně na zemi. */
const HANDSTAND_Y = Math.max(handWorld(MASCOT_POSES.handstand, -1).y, handWorld(MASCOT_POSES.handstand, 1).y);
const ARM_L = { x: V2.hip.x - V2.shoulder.dx, y: V2.shoulder.y };
const ARM_R = { x: V2.hip.x + V2.shoulder.dx, y: V2.shoulder.y };
const LEG_L = { x: V2.hip.x - V2.hipJoint.dx, y: V2.hipJoint.y };
const LEG_R = { x: V2.hip.x + V2.hipJoint.dx, y: V2.hipJoint.y };

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
  reaction, gaze, spin, idle, scrollLook, pose: poseProp, layer, still, act, train, travel,
}: MascotProps & { layer: Layer }) {
  const { c } = useTheme();
  const ink = monkeyInk(c);
  const drawBack = layer !== 'front';
  const drawLegs = layer !== 'back';
  const { reduced: motionReduced } = useMotionSafe();
  // Statická opice (galerie): stejné jako omezený pohyb, jen bez čtení systémového nastavení.
  const reduced = motionReduced || still === true;
  const px = resolveMascotSize(size);
  const {
    override: ov, ref: rootRef, lift, squash: rSquash, stretch, roll, tilt, eyeClose, droop: rDroop, pupilX, pupilY, headProps: headMatrix,
  } = useReactionMotion({ reaction, reduced, gaze, spin, idle, scrollLook, neck: V2.neck });
  const mood = ov?.mood ?? baseMood;
  const sleeping = ov?.sleeping === true;
  const breathe = breatheProp || sleeping;
  const hopEnabled = hopProp && !ov?.mood;
  const moodPose = MOOD_POSE[mood];
  // Idle akce s pózou (protažení = vis, radostný poskok = oslava) drží pózu `idlePoseMs`, pak zpět na náladu.
  // Jen celá opice: sedící na kotouči (dvě vrstvy) pózu nemění, jen hraje pohyb akce.
  // Akce repertoáru (26 animací): pokrčení ramen ze staré reakce hraje stejný přehrávač (paže v2).
  const effAct = act ?? (reaction?.id === 'shrug' ? { id: 'shrug' as const, key: -reaction.key } : null);
  const player = useActPlayer(effAct, reduced);
  const trainSpec = train ? TRAIN_FOR[train.silhouette] : null;
  // Mini opička při zatnutí zůstává v póze cviku (třes a zaťaté zuby přes ni).
  const actPose = train && effAct?.id === 'strain' ? null : player.pose;
  const idlePose = useIdlePose(layer === 'all' && !reduced && !effAct ? idle : null);
  const poseId = resolvePose({ pose: actPose ?? poseProp ?? trainSpec?.pose ?? idlePose, mood, reaction: ov && reaction ? reaction.id : null });
  const pose: MascotPose = MASCOT_POSES[poseId];
  const zeroSV = useSharedValue(0);
  const tPhase = train?.phase ?? zeroSV;
  const tMode = trainSpec?.mode ?? -1;
  const { live, clock, toCode, to: target, extrasIn, on: lifeOn } = usePoseMotion(poseId, reduced, { code: player.code, t: player.t, trainMode: tMode, trainPhase: tPhase });
  const aCode = player.code, aT = player.t;
  const TRAV = travel === false ? 0 : 1;
  /** Mini opička v lekci: jen tělo a končetiny podle fáze cviku. */
  const lite = trainSpec !== null;
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
    // Celé tělo akce repertoáru (viewBox → pt): posun, náklon, měřítko kolem chodidel, krytí; výskok mini opičky.
    const b = actBody(aCode.value, aT.value, TRAV);
    const k = b[3] ?? 1;
    const sy = (1 + breath.value * breathScale - squash.value * motion.hop.squash - rSquash.value + stretch.value - bob.value) * k;
    const sx = (1 + (squash.value * motion.hop.squash + rSquash.value) * 0.6) * k;
    const u = px / 200;
    return {
      opacity: b[4] ?? 1,
      transform: [
        { translateX: (b[0] ?? 0) * u },
        { translateY: (hop.value + lift.value - (sy - 1) / 2) * px + ((b[1] ?? 0) + trainLift(tMode, tPhase.value)) * u },
        { translateY: px / 2 }, { rotate: `${tilt.value + (b[2] ?? 0)}deg` }, { translateY: -px / 2 },
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
  // Výška a pokles očí jdou z živé pózy (přechod otevřené → přivřené je plynulý).
  const EY = V2.eyes.cy;
  const eyeL = useAnimatedProps(() => {
    const close = Math.min(1, Math.max(0, eyeClose.value));
    const blink = Math.max(0, Math.min(1, eyeRy.value / EYE_RY_OPEN));
    const v = live.value;
    return {
      ry: Math.max(EYE_RY_MIN, (v[15] ?? 0) * (v[20] ?? 1) * blink * (1 - close) + EYE_RY_MIN * close),
      cx: cxL + (v[19] ?? 0) + pupilX.value * PX,
      cy: EY + (v[16] ?? 0) + Math.min(1, rDroop.value) * GAZE_DOWN + pupilY.value * PY,
    };
  });
  const eyeR = useAnimatedProps(() => {
    const close = Math.min(1, Math.max(0, eyeClose.value));
    const blink = Math.max(0, Math.min(1, eyeRy.value / EYE_RY_OPEN));
    const v = live.value;
    return {
      ry: Math.max(EYE_RY_MIN, (v[15] ?? 0) * (v[20] ?? 1) * blink * (1 - close) + EYE_RY_MIN * close),
      cx: cxR + (v[19] ?? 0) + pupilX.value * PX,
      cy: EY + (v[16] ?? 0) + Math.min(1, rDroop.value) * GAZE_DOWN + pupilY.value * PY,
    };
  });
  const headProps = useAnimatedProps(() => headMatrix.value);

  // Kostra pózy na UI vlákně: tělo (kolem kyčlí), houpání ve visu (kolem hrazdy), hlava (kolem krku), končetiny.
  const HX = V2.hip.x, HY = V2.hip.y, NX = V2.neck.x, NY = V2.neck.y, BAR = HANG_BAR_Y;
  const AU = V2.arm.upper, AL = V2.arm.lower, LU = V2.leg.upper, LL = V2.leg.lower;
  const bodyProps = useAnimatedProps(() => {
    const v = live.value;
    return groupMatrix(v[8] ?? 0, HX, HY, v[9] ?? 0, v[10] ?? 0, IS_WEB);
  });
  const STAND = HANDSTAND_Y;
  const swayProps = useAnimatedProps(() => {
    const code = toCode.value;
    return groupMatrix(swayDeg(code, clock.value, lifeOn) + actSway(aCode.value, aT.value), 100, swayPivotY(code, BAR, STAND), 0, 0, IS_WEB);
  });
  // Výřez postavy se prolíná (žádný skok v polovině přechodu): krytí trupu a končetin, busty, spodní ořez.
  const fullProps = useAnimatedProps(() => ({ opacity: Math.max(0, Math.min(1, live.value[21] ?? 1)) }));
  const bustProps = useAnimatedProps(() => ({ opacity: Math.max(0, Math.min(1, live.value[22] ?? 0)) }));
  const clipProps = useAnimatedProps(() => ({ height: live.value[23] ?? 200 }));
  // Uši: dokmitání za hlavou = malé natočení kolem středu hlavy (každé ucho zvlášť).
  const HCX = V2.head.cx, HCY = V2.head.cy;
  const earLProps = useAnimatedProps(() => groupMatrix(live.value[17] ?? 0, HCX, HCY, 0, 0, IS_WEB));
  const earRProps = useAnimatedProps(() => groupMatrix(live.value[18] ?? 0, HCX, HCY, 0, 0, IS_WEB));
  const poseHeadProps = useAnimatedProps(() => {
    const v = live.value;
    return groupMatrix(v[13] ?? 0, NX, NY, v[11] ?? 0, v[12] ?? 0, IS_WEB);
  });
  const armLX = ARM_L.x, armRX = ARM_R.x, armY = ARM_L.y, legLX = LEG_L.x, legRX = LEG_R.x, legY = LEG_L.y;
  const armLProps = useAnimatedProps(() => {
    const v = live.value; const r = v[14] ?? 1;
    return { d: limbD(armLX, armY, AU * r, AL * r, v[0] ?? 0, v[1] ?? 0, -1) };
  });
  const armRProps = useAnimatedProps(() => {
    const v = live.value; const r = v[14] ?? 1;
    return { d: limbD(armRX, armY, AU * r, AL * r, v[2] ?? 0, v[3] ?? 0, 1) };
  });
  const legLProps = useAnimatedProps(() => {
    const v = live.value;
    return { d: limbD(legLX, legY, LU, LL, v[4] ?? 0, v[5] ?? 0, -1) };
  });
  const legRProps = useAnimatedProps(() => {
    const v = live.value;
    return { d: limbD(legRX, legY, LU, LL, v[6] ?? 0, v[7] ?? 0, 1) };
  });

  // Výchozí (statické) hodnoty = cílová póza; za běhu je přepisují animované props výše.
  const bodyT = groupMatrix(pose.body, HX, HY, pose.dx, pose.dy, IS_WEB);
  const headT = groupMatrix(pose.head.tilt, NX, NY, pose.head.dx, pose.head.dy, IS_WEB);
  const swayT = groupMatrix(0, 100, BAR, 0, 0, IS_WEB);
  const earT = groupMatrix(0, HCX, HCY, 0, 0, IS_WEB);
  const { head, ears, torso, eyes } = V2;
  // Výřez postavy (busta, jen hlava) a spodní ořez (vykukování přes hranu, busta v kruhu).
  // Výřez i ořez jdou z živého vektoru (prolnutí), statické hodnoty = cílová póza. Ořez jen u celé opice
  // (sedící dvouvrstvá opice na mapě ho nikdy nemá).
  const full = pose.figure === 'full';
  const bust = pose.figure === 'bust';
  const clipId = `mclip${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const clipOn = layer === 'all';
  const clipH = pose.clipY > 0 ? pose.clipY : 200;
  const propMotion = { clock, code: toCode, entry: extrasIn, on: lifeOn, actCode: aCode, actT: aT, live, target };
  const limb = (d: string, w: number, key: string, animatedProps: Partial<{ d: string }>) => (
    <AnimatedPath key={key} d={d} stroke={ink.fur} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" animatedProps={animatedProps} />
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
        <PropMotionContext.Provider value={propMotion}>
        {drawBack && !lite ? <PoseExtras pose={pose} ink={ink} extrasIn={extrasIn} clock={clock} zzMoving={poseId === 'sleep' && !reduced} /> : null}
        {clipOn ? (
          <Defs><ClipPath id={clipId}><AnimatedRect x={0} y={0} width={200} height={clipH} animatedProps={clipProps} /></ClipPath></Defs>
        ) : null}
        <G clipPath={clipOn ? `url(#${clipId})` : undefined}>
        <AnimatedG {...swayT} animatedProps={swayProps}>
        <AnimatedG {...bodyT} animatedProps={bodyProps}>
          {drawBack ? <AnimatedG opacity={bust ? 1 : 0} animatedProps={bustProps}>{bustShape(ink)}</AnimatedG> : null}
          {/* Trup a končetiny jedna skupina: výřez full ↔ busta/hlava se prolne jako celek (bez švů na překryvu). */}
          <AnimatedG opacity={full ? 1 : 0} animatedProps={fullProps}>
          {/* Nohy: vlastní vrstva s pivotem v kyčli (sedící opice je kreslí vpředu přes hranu kotouče). */}
          {drawLegs ? (
            <G testID={full ? 'mascot-legs' : undefined}>
              {limb(legPath(pose, -1), V2.leg.w, 'legL', legLProps)}
              {limb(legPath(pose, 1), V2.leg.w, 'legR', legRProps)}
            </G>
          ) : null}
          {drawBack ? (
            <>
              <Rect x={torso.x} y={torso.y} width={torso.w} height={torso.h} rx={torso.rx} fill={ink.fur} />
              {/* Paže: pivot v rameni, loket = druhý bod tahu. */}
              <G testID={full ? 'mascot-arms' : undefined}>
                {limb(armPath(pose, -1), V2.arm.w, 'armL', armLProps)}
                {limb(armPath(pose, 1), V2.arm.w, 'armR', armRProps)}
              </G>
            </>
          ) : null}
          </AnimatedG>
          {drawBack ? (
            <>
              {/* Hlava: náklon pózy kolem krku, nad ním matice reakcí (natočení, kývnutí). */}
              <AnimatedG {...headT} animatedProps={poseHeadProps}>
                <AnimatedG animatedProps={headProps}>
                  {lite ? (
                    // Mini opička (cvičí s tebou): uši a oči statické, bez obličejových rekvizit (perf, volba uživatele 2026-10-14).
                    <>
                      <Circle cx={head.cx - ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} />
                      <Circle cx={head.cx + ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} />
                    </>
                  ) : (
                    <>
                      <AnimatedG {...earT} animatedProps={earLProps}><Circle cx={head.cx - ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} /></AnimatedG>
                      <AnimatedG {...earT} animatedProps={earRProps}><Circle cx={head.cx + ears.dx} cy={head.cy + ears.dy} r={ears.r} fill={ink.fur} /></AnimatedG>
                    </>
                  )}
                  <Circle cx={head.cx} cy={head.cy} r={head.r} fill={ink.fur} />
                  <Path d={V2.face} fill={ink.face} />
                  {lite ? (
                    <>
                      <Ellipse cx={head.cx - eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} />
                      <Ellipse cx={head.cx + eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} />
                    </>
                  ) : (
                    <>
                      <AnimatedEllipse cx={head.cx - eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} animatedProps={eyeL} />
                      <AnimatedEllipse cx={head.cx + eyes.dx} cy={eyeCy} rx={eyes.rx} ry={baseRy} fill={ink.eye} animatedProps={eyeR} />
                    </>
                  )}
                  {/* Obličej pózy (smích, zatnutí, čelenka): ve skupině hlavy, jde s jejím náklonem. */}
                  {lite ? null : propsFace(pose.extra, ink, eyeCy)}
                  {/* Zatnutí v posledních 3 s výdrže na mini opičce, která zůstává v póze cviku. */}
                  {!lite && effAct?.id === 'strain' && pose.extra !== 'clench' ? propsFace('clench', ink, eyeCy) : null}
                </AnimatedG>
              </AnimatedG>
            </>
          ) : null}
        </AnimatedG>
        </AnimatedG>
        </G>
        {drawBack && !lite ? <PropLayer testID="mascot-props-front" nodes={propsFront(pose.extra, pose, ink)} extrasIn={extrasIn} /> : null}
        {drawBack && !reduced && (effAct?.id === 'grow' || effAct?.id === 'eveningTowel') ? (
          <ActExtras kind={effAct.id} t={aT} live={live} ink={ink} />
        ) : null}
        </PropMotionContext.Provider>
      </Svg>
    </Animated.View>
  );
}

/** Idle akce s pózou: drží ji `mascotPose.idlePoseMs` od nového klíče, pak `null` (zpět na náladu). */
function useIdlePose(idle: MascotProps['idle']): MascotPoseId | null {
  // Klíč akce, jejíž póza už vypršela (setState jen z časovače, ne v těle efektu).
  const [expired, setExpired] = useState<number | null>(null);
  const key = idle?.key ?? null;
  const pose = idle ? poseForIdle(idle.id) : null;
  useEffect(() => {
    if (key === null || !pose) return;
    const t = setTimeout(() => setExpired(key), MP.idlePoseMs);
    return () => clearTimeout(t);
  }, [key, pose]);
  return pose && key !== expired ? pose : null;
}

interface ExtrasProps {
  pose: MascotPose;
  ink: ReturnType<typeof monkeyInk>;
  /** Náběh doplňků 0 → 1 při vstupu do pózy (rozsvícení teček). */
  extrasIn: SharedValue<number>;
  /** Hodina živé smyčky (`usePoseMotion`), Zz z ní stoupají s periodou `zzPeriodMs`. */
  clock: SharedValue<number>;
  /** Zz stoupají (bez omezeného pohybu); jinak stojí rozsvícené. */
  zzMoving: boolean;
}

/** Tečkové doplňky pózy ve světových souřadnicích: červená tečka radosti, záblesk, Zz, hrazda. */
function PoseExtras({ pose, ink, extrasIn, clock, zzMoving }: ExtrasProps) {
  const top = V2.head.cy - V2.head.r + pose.dy + pose.head.dy;
  const LAG = MP.extrasLag;
  const RISE = MP.zzRise;
  const ZK = LIFE_CLOCK_MS / MP.zzPeriodMs;
  const moving = zzMoving ? 1 : 0;
  // Oslava: červená tečka naroste (bez zákmitu), vnitřní paprsky se rozsvítí, vnější o `extrasLag` později.
  const joyProps = useAnimatedProps(() => ({ r: 5 * Math.min(1, extrasIn.value / (1 - LAG)), opacity: Math.min(1, extrasIn.value * 2) }));
  const innerProps = useAnimatedProps(() => ({ opacity: Math.min(1, extrasIn.value / (1 - LAG)) }));
  const outerProps = useAnimatedProps(() => ({ opacity: Math.max(0, (extrasIn.value - LAG) / (1 - LAG)) }));
  // Zz: dvě „Z“ stoupají a mizí v protifázi; s omezeným pohybem stojí rozsvícené.
  const zA = useAnimatedProps(() => {
    const f = zzFrame(clock.value * ZK, RISE);
    return moving ? { opacity: f.opacity, ...groupMatrix(0, 0, 0, 0, f.ty, IS_WEB) } : { opacity: 1 };
  });
  const zB = useAnimatedProps(() => {
    const f = zzFrame(clock.value * ZK + 0.5, RISE);
    return moving ? { opacity: f.opacity, ...groupMatrix(0, 0, 0, 0, f.ty, IS_WEB) } : { opacity: 1 };
  });
  const nodes = [];
  if (pose.joyDot) nodes.push(<AnimatedCircle key="joy" testID="mascot-joy" cx={100} cy={top - 16} r={5} fill={ink.live} animatedProps={joyProps} />);
  if (pose.extra === 'burst') {
    // Pět krátkých paprsků z teček nad hlavou (oslava), vějíř −60…60°, dva prstence.
    [26, 33].forEach((r, k) => {
      const ring: React.ReactElement[] = [];
      [-60, -30, 0, 30, 60].forEach((deg) => {
        if (deg === 0 && k === 0) return;
        const a = ((deg - 90) * Math.PI) / 180;
        ring.push(<Circle key={`b${deg}${k}`} cx={100 + Math.cos(a) * r} cy={top + Math.sin(a) * r} r={2} fill={ink.prop} />);
      });
      nodes.push(<AnimatedG key={`ring${k}`} animatedProps={k === 0 ? innerProps : outerProps}>{ring}</AnimatedG>);
    });
  }
  if (pose.extra === 'zz') {
    // Dvě „Z“ z teček, menší a větší, šikmo nad hlavou spící opice.
    const z = (x: number, y: number, s: number, key: string) => {
      const pts = [[0, 0], [1, 0], [2, 0], [1.5, 0.75], [1, 1.5], [0.5, 2.25], [0, 3], [1, 3], [2, 3]] as const;
      return pts.map(([u, v], i) => <Circle key={`${key}${i}`} cx={x + u * s} cy={y + (v * s * 2) / 3} r={s * 0.32} fill={ink.prop} />);
    };
    nodes.push(<AnimatedG key="za" animatedProps={zA}>{z(140, 96, 5, 'za')}</AnimatedG>);
    nodes.push(<AnimatedG key="zb" animatedProps={zB}>{z(158, 66, 7, 'zb')}</AnimatedG>);
  }
  if (pose.extra === 'bar') {
    const l = handWorld(pose, -1), r = handWorld(pose, 1);
    const y = Math.min(l.y, r.y) - 6;
    for (let x = 52; x <= 148; x += 8) nodes.push(<Circle key={`bar${x}`} cx={x} cy={y} r={2.6} fill={ink.prop} />);
  }
  const back = propsBack(pose.extra, pose, ink);
  if (back.length) nodes.push(<PropLayer key="props" testID="mascot-props-back" nodes={back} extrasIn={extrasIn} />);
  return <G testID="mascot-extras">{nodes}</G>;
}

/** Vrstva rekvizit: rozsvítí se s náběhem pózy (`extrasIn`); worklet drží jen sdílenou hodnotu. */
function PropLayer({ nodes, extrasIn, testID }: { nodes: React.ReactElement[]; extrasIn: SharedValue<number>; testID: string }) {
  const fade = useAnimatedProps(() => ({ opacity: Math.min(1, extrasIn.value * 1.5) }));
  if (!nodes.length) return null;
  return <AnimatedG testID={testID} animatedProps={fade}>{nodes}</AnimatedG>;
}

/**
 * Tečky akce, které nepatří žádné póze: kruh růstu kolem opice (`grow`, tečky rostou po obvodu) a ručník
 * kroužící nad dlaní (`eveningTowel`, dlaň z živé kostry). Worklety čtou jen sdílené hodnoty a čísla.
 */
function ActExtras({ kind, t, live, ink }: { kind: 'grow' | 'eveningTowel'; t: SharedValue<number>; live: SharedValue<number[]>; ink: ReturnType<typeof monkeyInk> }) {
  if (kind === 'grow') {
    return <G testID="mascot-act-grow">{Array.from({ length: GROW_DOTS }, (_, i) => <GrowDot key={i} i={i} t={t} fill={ink.prop} />)}</G>;
  }
  return <G testID="mascot-act-towel">{Array.from({ length: TOWEL_DOTS }, (_, i) => <TowelDot key={i} i={i} t={t} live={live} fill={ink.prop} />)}</G>;
}

const TOWEL_DOTS = 8;
const PROP_DOT = PROP.dot;

function GrowDot({ i, t, fill }: { i: number; t: SharedValue<number>; fill: string }) {
  const n = GROW_DOTS, CY = GROW_R.cy;
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  const ca = Math.cos(a), sa = Math.sin(a);
  const p = useAnimatedProps(() => {
    const g = growDot(t.value, i, n);
    const d = g[1] ?? 0;
    return { r: g[0] ?? 0, cx: 100 + ca * d, cy: CY + sa * d, opacity: g[2] ?? 0 };
  });
  return <AnimatedCircle cx={100} cy={CY} r={0} fill={fill} animatedProps={p} />;
}

function TowelDot({ i, t, live, fill }: { i: number; t: SharedValue<number>; live: SharedValue<number[]>; fill: string }) {
  const n = TOWEL_DOTS;
  const p = useAnimatedProps(() => {
    const h = handAt(live.value, 1);
    const d = towelDot(t.value, i, n, h[0] ?? 0, h[1] ?? 0);
    return { cx: d[0] ?? 0, cy: d[1] ?? 0, opacity: d[2] ?? 0 };
  });
  return <AnimatedCircle cx={100} cy={100} r={PROP_DOT} fill={fill} opacity={0} animatedProps={p} />;
}
