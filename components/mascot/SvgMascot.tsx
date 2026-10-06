import { useEffect, useId, useRef } from 'react';
import Animated, {
  type SharedValue, cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { MascotStage, Mood } from '@/types';
import { ANCHORS, type Anchor } from './anchors';
import { ArmPoseContext, layerParts, SeasonScarf, type LayerPart } from './cosmetics';
import { armPoint, STAGE_GEOMETRY, type Limb, type StageGeometry } from './geometry';
import { MASCOT_COLORS, mascotInk } from './palette';
import { useReactionMotion } from './reactionMotion';
import { resolveMascotSize, type MascotProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

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
// Celebrate: paže z klidového úhlu nahoru. Brief: 180 − 20 = 160° (ruce nad hlavou, mírně od sebe).
// Kratší paže stage 1–2 by v 160° skončily za velkou hlavou (stage 1: ruka 41 od středu hlavy r 54),
// proto se úhel otevře, až ruka hlavu mine: stage 1 120°, stage 2 140° (ruce nahoru do V), stage 3 160°.
const ARMS_UP_ANGLE: Record<MascotStage, number> = { 1: 120, 2: 140, 3: 160 };
// Sad: uši o 8 dolů a 4 ven, pohled (oči a odlesky) o 3 dolů.
const EARS_DOWN_Y = 8;
const EARS_DOWN_X = 4;
const GAZE_DOWN = 3;
// Krk: bod otáčení hlavy při reakcích leží pod středem hlavy, v tomto podílu jejího poloměru.
const NECK_AT = 0.8;
// Stage 3: posun deltoidu při plně zvednutých pažích (jednotky viewBoxu 200).
const DELT_RAISE_Y = 6;
const DELT_RAISE_X = 2;

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
const DELT_LIGHT = 5;

/** Trapéz stage 3: od vrcholu deltoidu šikmo nahoru ke krku (úpon schovaný pod hlavou), spodek zajede pod trup. */
function trapPath(sh: NonNullable<StageGeometry['shoulders']>): string {
  const top = sh.y - sh.r;
  const l = 100 - sh.dx;
  const r = 100 + sh.dx;
  const neck = 20;
  return `M ${l} ${top} Q ${100 - neck - 8} ${top - 1} ${100 - neck} ${sh.trapY} L ${100 + neck} ${sh.trapY} Q ${100 + neck + 8} ${top - 1} ${r} ${top} L ${r} ${sh.y} L ${l} ${sh.y} Z`;
}
// Stage 3: biceps v 40 % délky paže, poloměr 0.6 šířky paže.
const BICEP_AT = 0.4;
const BICEP_R = 0.6;
const WINTER_SCARF_ID = 'outfit-winter-arc-scarf';

/** Která část opice se kreslí: `all` = celá (výchozí `<Mascot>`), `back`/`front` = dvě vrstvy pro sezení
 *  na kotouči (Teplá litina §2.7). Obě vrstvy mají stejný viewBox i animaci těla, složené dají `all`. */
type Layer = 'all' | 'back' | 'front';

/** Geometrická opice stage 1–3 z `STAGE_GEOMETRY` (spec §8) s kosmetickými vrstvami na kotvách z `anchors.ts`. */
export function SvgMascot(props: MascotProps) {
  return <MascotSvg {...props} layer="all" />;
}

/** Zadní vrstva sedící opice: trup, hlava, paže, ovinutí šálu. Nese popisek pro čtečku. Kotouč leží pod ní. */
export function MonkeyBack(props: MascotProps) {
  return <MascotSvg {...props} layer="back" />;
}

/** Přední vrstva sedící opice: nohy přes hranu kotouče a konec šálu přes jeho čelo. Vždy dekorativní. */
export function MonkeyFront(props: MascotProps) {
  return <MascotSvg {...props} decorative layer="front" />;
}

/** Obdélník přes celé plátno minus zaoblený trup (evenodd): nohy přední vrstvy jen tam, kde je trup nezakrývá. */
function outsideTorsoPath({ x, y, w, h, rx }: StageGeometry['torso']): string {
  return `M0 0 H200 V200 H0 Z M${x + rx} ${y} H${x + w - rx} A${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V${y + h - rx} `
    + `A${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} A${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V${y + rx} A${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`;
}

function MascotSvg({
  stage, mood: baseMood, size, cosmetics, accessibilityLabel, decorative, breathe: breatheProp = true, hop: hopProp = true, scarfEdge: scarfProp = false,
  reaction, gaze, spin, layer,
}: MascotProps & { layer: Layer }) {
  const { c, seasonThemeId } = useTheme();
  const drawBack = layer !== 'front';
  const drawFront = layer !== 'back';
  const { reduced } = useMotionSafe();
  const px = resolveMascotSize(size);
  const g = STAGE_GEOMETRY[stage];
  // Reakce (fáze 3): dočasně přebije náladu (a hranu šálu); spánek zavře oči a zpomalí dech.
  const {
    override: ov, ref: rootRef, lift, squash: rSquash, stretch, roll, tilt, eyeClose, droop: rDroop, pupilX, pupilY, headProps: headMatrix,
  } = useReactionMotion({ reaction, reduced, gaze, spin, neck: { x: g.head.cx, y: g.head.cy + g.head.r * NECK_AT } });
  const mood = ov?.mood ?? baseMood;
  const scarfEdge = scarfProp || ov?.scarf === true;
  const sleeping = ov?.sleeping === true;
  // Spící opička dýchá i tam, kde vlastní dech jinak nemá (uzel mapy): pomalý hluboký dech je celá reakce.
  const breathe = breatheProp || sleeping;
  // Přebitá nálada poskoky nespouští (reakce má vlastní pohyb); poskoky nálady z `mood` po ní pokračují.
  const hopEnabled = hopProp && !ov?.mood;
  const pose = MOOD_POSE[mood];
  const breathScale = sleeping ? motion.reactions.sleep.breathScale : pose.face === 'sad' ? BREATH_SCALE_SAD : BREATH_SCALE;
  const breathHalfMs = sleeping ? motion.reactions.sleep.breathHalfMs : pose.breathHalfMs;
  const ink = mascotInk(c);
  // ID ořezů musí být v dokumentu unikátní (na webu je víc opic v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const clip = { body: `mascot-body-${uid}`, head: `mascot-head-${uid}`, deltL: `mascot-delt-l-${uid}`, deltR: `mascot-delt-r-${uid}`, legs: `mascot-legs-${uid}` };
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
  // Vlastní šál opičky (§4). Sezónní nebo nasazená zimní šála ho nahradí, dvě šály přes sebe nedávají smysl.
  const ownScarf = seasonScarf.length === 0 && cosmetics.outfit !== WINTER_SCARF_ID;
  const wrapped = pose.face === 'sad';
  const scarfWrap = ownScarf ? <ScarfWrap g={g} wrapped={wrapped} edge={scarfEdge ? c.accentGraphic : null} /> : null;

  // Dýchání celého těla; smutek dýchá pomaleji a mělčeji. Střed škálování je uprostřed plátna,
  // translateY vrací spodní hranu zpět: opice stojí na místě a dýchá nahoru.
  const breath = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(breath);
    breath.value = 0;
    if (reduced || !breathe) return;
    breath.value = withRepeat(withTiming(1, { duration: breathHalfMs, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [reduced, breathe, breath, breathHalfMs]);

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

  // Poskoky (herní odměna). happy = jeden skok při změně nálady na happy, celebrate = opakované
  // poskoky s pauzou na zemi, dokud nálada trvá; změna nálady je zruší a opice dosedne timingem.
  // Skok (UX2, `motion.hop`): přikrčení (squash) → odraz ease-out → pád s gravitací → dopad (squash)
  // → narovnání. Bez pružiny na výšce, takže opice nikdy neklesne pod klid (dřív ~16 pt pod zem).
  // Při omezení pohybu bez skoků; samo přepnutí omezení skok nespustí.
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
    if (reduced) {
      hop.value = 0;
      squash.value = 0;
    } else if (!hopEnabled) {
      hop.value = withTiming(0, motion.moodShift);
      squash.value = withTiming(0, motion.moodShift);
    } else if (p.hopRepeat) {
      const rest = motion.celebrateRestMs + h.landMs + h.recoverMs;
      hop.value = withRepeat(withSequence(jump(), withDelay(rest, withTiming(0, { duration: 0 }))), -1);
      squash.value = withRepeat(withSequence(squashJump(), withDelay(motion.celebrateRestMs, withTiming(0, { duration: 0 }))), -1);
    } else if (p.face === 'happy' && changed) {
      hop.value = jump();
      squash.value = squashJump();
    } else {
      hop.value = withTiming(0, motion.moodShift);
      squash.value = withTiming(0, motion.moodShift);
    }
  }, [baseMood, reduced, hopEnabled, hop, squash]);
  useEffect(() => () => { cancelAnimation(hop); cancelAnimation(squash); }, [hop, squash]);

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

  const bodyStyle = useAnimatedStyle(() => {
    const sy = 1 + breath.value * breathScale - squash.value * motion.hop.squash - rSquash.value + stretch.value;
    const sx = 1 + (squash.value * motion.hop.squash + rSquash.value) * 0.6;
    return {
      transform: [
        // Škálování drží chodidla na zemi: o kolik se spodní hrana změnou scaleY posune, o tolik ji translateY vrátí.
        { translateY: (hop.value + lift.value - (sy - 1) / 2) * px },
        // Náklon (mávnutí) kolem chodidel, salto kolem středu.
        { translateY: px / 2 }, { rotate: `${tilt.value}deg` }, { translateY: -px / 2 },
        { rotate: `${roll.value}deg` },
        { scaleY: sy },
        { scaleX: sx },
      ],
    };
  });
  const P = motion.reactions.gaze;
  // Oči: mrknutí, zavření reakcí (spánek, mazlení), pohled dolů (smutek, scroll) a pupily za prstem.
  const eyeLeftProps = useAnimatedProps(() => ({
    ry: eyeRy.value + (EYE_RY_CLOSED - eyeRy.value) * eyeClose.value,
    cx: 84 + pupilX.value * P.pupilX,
    cy: 78 + Math.min(1, droop.value + rDroop.value) * GAZE_DOWN + pupilY.value * P.pupilY,
  }));
  const eyeRightProps = useAnimatedProps(() => ({
    ry: eyeRy.value + (EYE_RY_CLOSED - eyeRy.value) * eyeClose.value,
    cx: 116 + pupilX.value * P.pupilX,
    cy: 78 + Math.min(1, droop.value + rDroop.value) * GAZE_DOWN + pupilY.value * P.pupilY,
  }));
  const catchLeftProps = useAnimatedProps(() => ({
    opacity: interpolate(eyeRy.value + (EYE_RY_CLOSED - eyeRy.value) * eyeClose.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP),
    cx: 86 + pupilX.value * P.pupilX,
    cy: 75 + Math.min(1, droop.value + rDroop.value) * GAZE_DOWN + pupilY.value * P.pupilY,
  }));
  const catchRightProps = useAnimatedProps(() => ({
    opacity: interpolate(eyeRy.value + (EYE_RY_CLOSED - eyeRy.value) * eyeClose.value, CATCHLIGHT_FADE, [0, 1], Extrapolation.CLAMP),
    cx: 118 + pupilX.value * P.pupilX,
    cy: 75 + Math.min(1, droop.value + rDroop.value) * GAZE_DOWN + pupilY.value * P.pupilY,
  }));
  const earLeftProps = useAnimatedProps(() => {
    const dn = Math.min(1, droop.value + rDroop.value);
    return { cx: head.cx - ears.dx - dn * EARS_DOWN_X, cy: head.cy + ears.dy + dn * EARS_DOWN_Y };
  });
  const earRightProps = useAnimatedProps(() => {
    const dn = Math.min(1, droop.value + rDroop.value);
    return { cx: head.cx + ears.dx + dn * EARS_DOWN_X, cy: head.cy + ears.dy + dn * EARS_DOWN_Y };
  });
  const headProps = useAnimatedProps(() => headMatrix.value);
  const hatProps = useAnimatedProps(() => headMatrix.value);
  // Stage 3: deltoidy sledují zvednutí paží (celebrate): posunou se nahoru a mírně ven se stejným `arms`.
  const sh = shoulders ?? { dx: 0, y: 0, r: 0, trapY: 0 };
  const deltL = useAnimatedProps(() => ({ cx: 100 - sh.dx - arms.value * DELT_RAISE_X, cy: sh.y - arms.value * DELT_RAISE_Y }));
  const deltR = useAnimatedProps(() => ({ cx: 100 + sh.dx + arms.value * DELT_RAISE_X, cy: sh.y - arms.value * DELT_RAISE_Y }));
  const deltLightL = useAnimatedProps(() => ({ cx: 100 - sh.dx - arms.value * DELT_RAISE_X, cy: sh.y - DELT_LIGHT - arms.value * DELT_RAISE_Y }));
  const deltLightR = useAnimatedProps(() => ({ cx: 100 + sh.dx + arms.value * DELT_RAISE_X, cy: sh.y - DELT_LIGHT - arms.value * DELT_RAISE_Y }));
  const idleMouthProps = useAnimatedProps(() => ({ opacity: mouthIdle.value }));
  const happyMouthProps = useAnimatedProps(() => ({ opacity: mouthHappy.value }));
  const sadMouthProps = useAnimatedProps(() => ({ opacity: mouthSad.value }));

  return (
    <Animated.View
      ref={rootRef}
      {...(decorative
        ? { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: accessibilityLabel ?? copy.mascot.label[mood] })}
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
            <>
              <ClipPath id={clip.deltL}><AnimatedCircle r={shoulders.r} animatedProps={deltL} /></ClipPath>
              <ClipPath id={clip.deltR}><AnimatedCircle r={shoulders.r} animatedProps={deltR} /></ClipPath>
            </>
          )}
          {layer === 'front' && (
            <ClipPath id={clip.legs}><Path d={outsideTorsoPath(torso)} clipRule="evenodd" /></ClipPath>
          )}
        </Defs>

        {drawBack && (
        <>
        {/* Zadní vrstvy kosmetiky (kapuce) leží za celou opicí. */}
        {backLayers.map(({ Component, anchor }, i) => (
          <Component key={i} anchor={anchor === 'hands' ? anchors.handL : anchors[anchor]} stage={stage} ink={ink} />
        ))}

        {/* Hmotu dává jen plochý stín srsti dole: nohy, paže a srpky pod hlavou, tělem a čenichem. Bez gradientu.
            Celá opice kreslí nohy tady (za trupem); sedící dvojice je přesune do přední vrstvy. */}
        {layer === 'all' && (
          <>
            <Circle cx={100 - legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
            <Circle cx={100 + legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
          </>
        )}
        {/* Ramena paží leží uvnitř obrysu těla: horní konec paže zajede pod tělo, bez mezery. */}
        <Arm limb={g.armL} side={-1} bicep={bicep} raise={arms} upAngle={ARMS_UP_ANGLE[stage]} />
        <Arm limb={g.armR} side={1} bicep={bicep} raise={arms} upAngle={ARMS_UP_ANGLE[stage]} />
        {/* Vrstvy na rukou jedou po ose paže se stejnou pózou, takže se zvedají s celebrate. */}
        <ArmPoseContext.Provider value={{ raise: arms, upAngle: ARMS_UP_ANGLE[stage] }}>
          {renderLayers(pick('front', 'hands'), anchors.handL)}
        </ArmPoseContext.Provider>
        {/* Stage 3: trapéz šikmo stoupá od deltoidů ke krku (ramena, ne vodorovný límec), deltoidy jsou
            kulaté čepice nad pažemi se světlem shora jako hlava. */}
        {shoulders && (
          <>
            <Path d={trapPath(shoulders)} fill={MASCOT_COLORS.fur} />
            {([-1, 1] as const).map((side) => (
              <G key={side}>
                <AnimatedCircle r={shoulders.r} fill={MASCOT_COLORS.furShade} animatedProps={side < 0 ? deltL : deltR} />
                <AnimatedCircle
                  r={shoulders.r} fill={MASCOT_COLORS.fur} clipPath={`url(#${side < 0 ? clip.deltL : clip.deltR})`}
                  animatedProps={side < 0 ? deltLightL : deltLightR}
                />
              </G>
            ))}
          </>
        )}
        <Rect x={torso.x} y={torso.y} width={torso.w} height={torso.h} rx={torso.rx} fill={MASCOT_COLORS.furShade} />
        <Rect
          x={torso.x} y={torso.y - BODY_LIGHT} width={torso.w} height={torso.h} rx={torso.rx}
          fill={MASCOT_COLORS.fur} clipPath={`url(#${clip.body})`}
        />
        <Ellipse cx={100} cy={torso.y + torso.h / 2 - 2} rx={torso.w / 4} ry={torso.h * 0.23} fill={MASCOT_COLORS.face} />
        <G clipPath={`url(#${clip.body})`}>{renderLayers(pick('front', 'body'), anchors.body)}</G>
        {/* Šál volně pod bradou: hlava ho kreje, vidět je jen pod ní. Smutná ho má omotaný přes bradu (níž). */}
        {!wrapped && scarfWrap}

        {/* Hlava (uši, lebka, obličej, pokrývky hlavy) je jedna skupina: reakce ji natáčí kolem krku. */}
        <AnimatedG animatedProps={headProps}>
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

        </AnimatedG>
        {wrapped && scarfWrap}
        {renderLayers(pick('front', 'neck'), anchors.neck)}
        {/* Pokrývky hlavy leží nad šálem (pořadí beze změny) a natáčí se s hlavou stejnou maticí. */}
        <AnimatedG animatedProps={hatProps}>
          <G clipPath={`url(#${clip.head})`}>{renderLayers(pick('front', 'head'), anchors.head)}</G>
        </AnimatedG>
        </>
        )}

        {/* Přední vrstva sedící opice: nohy jen mimo obrys trupu (stejné pixely jako v celé opici), přes hranu kotouče. */}
        {layer === 'front' && (
          <G clipPath={`url(#${clip.legs})`}>
            <Circle cx={100 - legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
            <Circle cx={100 + legs.dx} cy={legs.y} r={legs.r} fill={MASCOT_COLORS.furShade} />
          </G>
        )}
        {drawFront && ownScarf ? <ScarfTail g={g} mood={mood} /> : null}
      </Svg>
    </Animated.View>
  );
}

/** Šál (jednotky viewBoxu 200): výška ovinutí volně / omotaně k bradě, spodní lem stínu, přesah přes trup,
 *  tloušťka jantarové hrany, šířka konce, o kolik konec visí pod kotvou sezení (přes čelo kotouče). */
const SCARF = { h: 12, hWrapped: 20, lip: 3, over: 4, edge: 3, tailW: 13, tailBelowSeat: 22, fringe: 4 };

/** Ovinutí šálu kolem krku: plochá šedomodrá páska se stínovým lemem dole, volitelně jantarová horní hrana. */
function ScarfWrap({ g, wrapped, edge }: { g: StageGeometry; wrapped: boolean; edge: string | null }) {
  const chin = g.head.cy + g.head.r;
  const h = wrapped ? SCARF.hWrapped : SCARF.h;
  const y = wrapped ? chin - 14 : chin - 6;
  const half = g.torso.w / 2 + SCARF.over;
  const x = 100 - half;
  const rx = h / 2;
  return (
    <G>
      <Rect x={x} y={y + SCARF.lip} width={half * 2} height={h} rx={rx} fill={MASCOT_COLORS.scarfShade} />
      <Rect x={x} y={y} width={half * 2} height={h} rx={rx} fill={MASCOT_COLORS.scarf} />
      {edge ? <ScarfEdge d={`M${x + rx} ${y + SCARF.edge / 2} L${100 + half - rx} ${y + SCARF.edge / 2}`} color={edge} /> : null}
    </G>
  );
}

/** Jantarová hrana šálu: při připojení se prolne 0 → 1 (`motion.scarfEdge`, 200 ms). Omezený pohyb: rovnou viditelná. */
function ScarfEdge({ d, color }: { d: string; color: string }) {
  const { reduced } = useMotionSafe();
  const o = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) o.value = withTiming(1, motion.scarfEdge);
    return () => cancelAnimation(o);
  }, [reduced, o]);
  const props = useAnimatedProps(() => ({ opacity: o.value }));
  return <AnimatedPath d={d} stroke={color} strokeWidth={SCARF.edge} strokeLinecap="round" fill="none" animatedProps={props} />;
}

/** Konec šálu (přední vrstva). Klid/radost: visí přes kotvu sezení na čelo kotouče, roztřepený konec.
 *  Oslava: vlaje do strany. Smutek: krátký, zastrčený na hrudi. */
function ScarfTail({ g, mood }: { g: StageGeometry; mood: Mood }) {
  const chin = g.head.cy + g.head.r;
  const w = SCARF.tailW;
  if (mood === 'celebrate') {
    const x = 100 + g.torso.w / 2 + SCARF.over - 6;
    const y = chin - 4;
    return (
      <Path
        d={`M${x} ${y} L${x + 24} ${y - 12} L${x + 30} ${y - 4} L${x + 24} ${y} L${x + 30} ${y + 4} L${x} ${y + 10} Z`}
        fill={MASCOT_COLORS.scarf}
      />
    );
  }
  const x = 100 + g.torso.w * 0.12;
  const top = chin + 2;
  const bottom = mood === 'sad' ? g.torso.y + g.torso.h * 0.6 : g.torso.y + g.torso.h + SCARF.tailBelowSeat;
  const f = SCARF.fringe;
  return (
    <G>
      <Path
        d={`M${x} ${top} L${x + w} ${top} L${x + w + 2} ${bottom} L${x + w - f} ${bottom - f} L${x + w / 2} ${bottom} L${x + 2} ${bottom - f} L${x - 2} ${bottom} Z`}
        fill={MASCOT_COLORS.scarf}
      />
      <Rect x={x - 1} y={top - 2} width={w + 2} height={6} rx={3} fill={MASCOT_COLORS.scarfShade} />
    </G>
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
