import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  type AnimatedRef, type DerivedValue, type SharedValue, type WithTimingConfig, cancelAnimation, Easing, measure, ReduceMotion, useAnimatedReaction, useAnimatedRef,
  useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import { ease, motion, spring } from '@/lib/motion';
import { isLongSpin } from '@/logic/mascotIdle';
import { degrade } from '@/logic/mascotReactions';
import type { ReactionId } from '@/logic/mascotReactions';
import type { Mood } from '@/types';
import type { MascotGaze, MascotIdle, MascotReaction } from './types';

const R = motion.reactions;
const I = motion.mascotIdle;
// Reakce běží i s omezeným pohybem (jako nálada a oči, viz `degrade`), proto vlastní ReduceMotion.Never:
// systémové omezení by jinak sekvenci rovnou dojelo na konec a změna očí by nebyla vidět.
const NEVER = { reduceMotion: ReduceMotion.Never } as const;
const t = (duration: number, easing: WithTimingConfig['easing'] = ease.out) => ({ duration, easing, ...NEVER });
const sine = (duration: number) => t(duration, ease.sine);
const back = { ...spring.sal, ...NEVER };
const IS_WEB = Platform.OS === 'web';

/** Dočasné přebití nálady reakcí (cuddle → happy, celebrate, sad…) a spánek (oči zavřené, pomalý dech). */
export interface ReactionOverride { mood?: Mood; scarf?: boolean; sleeping?: boolean }

const J = R.joyJump;
/** Přebití nálady pro reakce, které ho mají, a jak dlouho trvá (null = do další reakce nebo probuzení). */
const OVERRIDES: Partial<Record<ReactionId, { o: ReactionOverride; ms: number | null }>> = {
  cuddle: { o: { mood: 'happy' }, ms: R.cuddle.inMs + R.cuddle.holdMs },
  joyJump: { o: { mood: 'celebrate', scarf: true }, ms: J.crouchMs + J.riseMs + J.fallMs + J.landMs + J.recoverMs + R.celebrate.holdMs / 2 },
  wave: { o: { mood: 'happy' }, ms: R.wave.swingMs * R.wave.times * 2 },
  celebrate: { o: { mood: 'celebrate', scarf: true }, ms: R.celebrate.holdMs },
  sad: { o: { mood: 'sad' }, ms: R.sad.holdMs },
  sleep: { o: { sleeping: true }, ms: null },
};

export interface ReactionMotion {
  /** Celá opička: zdvih (zlomek strany, záporný = nahoru), zmáčknutí, vypnutí, salto (°), náklon kolem chodidel (°). */
  lift: SharedValue<number>; squash: SharedValue<number>; stretch: SharedValue<number>; roll: SharedValue<number>; tilt: SharedValue<number>;
  /** Zavření očí 0–1 a přídavek k `droop` (pohled a uši dolů). */
  eyeClose: SharedValue<number>; droop: SharedValue<number>;
  /** Pupily (−1…1, součet reakce, pohledu za prstem a sledování kotouče). */
  pupilX: SharedValue<number>; pupilY: SharedValue<number>;
  /** Transformace skupiny hlavy (SVG `transform` na webu, `matrix` na nativu) kolem krku. */
  headProps: DerivedValue<Record<string, unknown>>;
  override: ReactionOverride | null;
  /** Ref na kořen opičky: změří ji pro pohled za prstem. */
  ref: AnimatedRef<Animated.View>;
}

/**
 * Přehrání reakcí (motion-agent, fáze 3). Každý nový `reaction.key` přeruší předchozí reakci (žádná fronta)
 * a rozjede sekvenci na UI vlákně; JS jen nastaví dočasnou náladu a časovač jejího konce.
 * `reaction` → `null` = klid: spící opička otevře oči. Omezený pohyb: reakce projde `degrade` (bez skoků a rotací),
 * pohled za prstem hýbe jen pupilami.
 */
export function useReactionMotion({ reaction, reduced, gaze, spin, neck, idle, scrollLook }: {
  reaction: MascotReaction | null | undefined; reduced: boolean; gaze?: MascotGaze; spin?: SharedValue<number>;
  /** Idle akce (život v klidu); hraje se jen novým klíčem a jen bez omezeného pohybu. */
  idle?: MascotIdle | null;
  /** Směr scrollu mapy -1…1 (pupily vždy, hlava jen bez omezeného pohybu). */
  scrollLook?: SharedValue<number>;
  /** Bod otáčení hlavy (krk) ve viewBoxu 200. */
  neck: { x: number; y: number };
}): ReactionMotion {
  const lift = useSharedValue(0);
  const squash = useSharedValue(0);
  const stretch = useSharedValue(0);
  const roll = useSharedValue(0);
  const tilt = useSharedValue(0);
  const headRot = useSharedValue(0);
  const headY = useSharedValue(0);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);
  const eyeClose = useSharedValue(0);
  const droop = useSharedValue(0);
  const follow = useSharedValue(0);
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  // Přebití nálady se odvodí z přehrávané reakce; časovač jen označí klíč, jehož přebití už vypršelo.
  const [expired, setExpired] = useState<number | null>(null);
  const ref = useAnimatedRef<Animated.View>();

  // Pohled za prstem (UI vlákno): bod v okně → směr od očí opičky, plná výchylka v `reach` pt.
  const noGaze = useSharedValue<{ x: number; y: number } | null>(null);
  const g = gaze ?? noGaze;
  useAnimatedReaction(() => g.value, (p) => {
    if (!p) {
      gx.set(withSpring(0, back));
      gy.set(withSpring(0, back));
      return;
    }
    const m = measure(ref);
    if (!m) return;
    const dx = p.x - (m.pageX + m.width / 2);
    const dy = p.y - (m.pageY + m.height * 0.4);
    const k = 1 / Math.max(R.gaze.reach, Math.hypot(dx, dy));
    gx.set(withSpring(dx * k, back));
    gy.set(withSpring(dy * k, back));
  });

  const zero = useSharedValue(0);
  const s = spin ?? zero;
  const sl = scrollLook ?? zero;
  // Ujetý úhel kotouče během sledování (rad): po dlouhém roztočení se jí zatočí hlava. Skok > π = přetočení čísla, ne pohyb.
  const spinTravel = useSharedValue(0);
  useAnimatedReaction(() => s.value, (v, prev) => {
    if (prev === null || follow.value <= 0) return;
    const d = Math.abs(v - prev);
    if (d < Math.PI) spinTravel.value += d;
  });
  const pupilX = useDerivedValue(() => Math.max(-1, Math.min(1, lookX.value + gx.value + follow.value * Math.cos(s.value))));
  const pupilY = useDerivedValue(() => Math.max(-1, Math.min(1, lookY.value + gy.value + follow.value * Math.sin(s.value) * 0.6 + sl.value * I.scrollLook.pupil)));
  const headMove = reduced ? 0 : 1;
  const headProps = useDerivedValue((): Record<string, unknown> => {
    const deg = headRot.value + headMove * (gx.value * R.gaze.headDeg + follow.value * Math.sin(s.value) * R.spinFollow.headDeg);
    const tx = headMove * gx.value * R.gaze.headShift;
    const ty = headY.value + headMove * (gy.value * R.gaze.headShift * 0.5 + sl.value * I.scrollLook.headDip);
    const a = (deg * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // rotate(deg, krk) a posun: matrix(a b c d e f).
    const e = neck.x - cos * neck.x + sin * neck.y + tx;
    const f = neck.y - sin * neck.x - cos * neck.y + ty;
    return IS_WEB
      ? { transform: `matrix(${cos} ${sin} ${-sin} ${cos} ${e} ${f})` }
      : { matrix: [cos, sin, -sin, cos, e, f] };
  });

  // Idle akce (život v klidu): jen novým klíčem (návrat na obrazovku starou akci nepřehraje), nikdy s omezeným
  // pohybem. Používá stejné hodnoty jako reakce, takže nová reakce idle zruší (cancelAnimation) a převezme.
  // Každá sekvence končí v klidu (0), nic nezamrzne.
  const idleKey = idle?.key ?? null;
  const idleId = idle?.id ?? null;
  const playedIdle = useRef(0);
  useEffect(() => {
    if (idleKey === null || idleId === null || idleKey <= playedIdle.current || reduced) return;
    playedIdle.current = idleKey;
    const home = () => withSpring(0, back);
    switch (idleId) {
      case 'lookAround': {
        const a = I.lookAround;
        lookX.set(withSequence(withTiming(-a.pupil, t(a.glanceMs)), withDelay(a.holdMs, withTiming(a.pupil, sine(a.crossMs))), withDelay(a.holdMs, home())));
        headRot.set(withSequence(withTiming(-a.deg, t(a.glanceMs)), withDelay(a.holdMs, withTiming(a.deg, sine(a.crossMs))), withDelay(a.holdMs, home())));
        break;
      }
      case 'doubleBlink': {
        const b = I.doubleBlink;
        eyeClose.set(withSequence(
          withTiming(1, t(b.closeMs)), withTiming(0, t(b.openMs)), withDelay(b.gapMs, withTiming(1, t(b.closeMs))), withTiming(0, t(b.openMs)),
        ));
        break;
      }
      case 'stretch': {
        const a = I.stretch;
        stretch.set(withSequence(withTiming(a.scale, sine(a.inMs)), withDelay(a.holdMs, home())));
        lift.set(withSequence(withTiming(-a.lift, sine(a.inMs)), withDelay(a.holdMs, home())));
        eyeClose.set(withSequence(withTiming(a.squint, sine(a.inMs)), withDelay(a.holdMs, withTiming(0, t(a.inMs)))));
        lookY.set(withSequence(withTiming(-0.4, sine(a.inMs)), withDelay(a.holdMs, home())));
        break;
      }
      case 'sway': {
        const a = I.sway;
        const swings = Array.from({ length: a.swings }, (_, i) => withTiming((i % 2 ? -1 : 1) * a.deg, sine(i === 0 ? a.swingMs / 2 : a.swingMs)));
        tilt.set(withSequence(...swings, home()));
        break;
      }
      case 'headScratch': {
        const a = I.headScratch;
        const hold = a.holdMs + a.beats * 2 * a.beatMs;
        const beats = Array.from({ length: a.beats }, () => [withTiming(a.dip, t(a.beatMs)), withTiming(0, t(a.beatMs))]).flat();
        headRot.set(withSequence(withTiming(a.deg, t(a.inMs)), withDelay(hold, home())));
        headY.set(withDelay(a.inMs, withSequence(...beats)));
        lookY.set(withSequence(withTiming(-0.5, t(a.inMs)), withDelay(hold, home())));
        break;
      }
      case 'joyHop': {
        const h = motion.hop;
        const a = I.joyHop;
        lift.set(withSequence(withTiming(0, t(h.crouchMs)), withTiming(-a.height, t(h.riseMs)), withTiming(0, t(h.fallMs, ease.gravity))));
        squash.set(withSequence(
          withTiming(a.squash, t(h.crouchMs)), withTiming(0, t(h.riseMs)), withTiming(0, t(h.fallMs)),
          withTiming(a.squash, t(h.landMs)), withTiming(0, t(h.recoverMs)),
        ));
        break;
      }
      case 'lookPlate': {
        const a = I.lookPlate;
        lookY.set(withSequence(withTiming(a.pupil, sine(a.inMs)), withDelay(a.holdMs, home())));
        headY.set(withSequence(withTiming(a.dip, sine(a.inMs)), withDelay(a.holdMs, home())));
        headRot.set(withSequence(withTiming(a.deg, sine(a.inMs)), withDelay(a.holdMs, home())));
        break;
      }
      case 'yawn': {
        const a = I.yawn;
        const out = () => withTiming(0, sine(a.outMs));
        headY.set(withSequence(withTiming(-a.headBack, sine(a.inMs)), withDelay(a.holdMs, out())));
        headRot.set(withSequence(withTiming(a.deg, sine(a.inMs)), withDelay(a.holdMs, out())));
        eyeClose.set(withSequence(withTiming(a.squint, sine(a.inMs)), withDelay(a.holdMs, out())));
        stretch.set(withSequence(withTiming(a.stretch, sine(a.inMs)), withDelay(a.holdMs, out())));
        break;
      }
    }
    // Spouští se jen novým klíčem idle akce; sdílené hodnoty jsou stabilní.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleKey]);

  const id = reaction ? degrade(reaction.id, reduced) : null;
  const key = reaction?.key ?? null;
  const entry = id ? OVERRIDES[id] : undefined;
  const override = entry && expired !== key ? entry.o : null;
  useEffect(() => {
    const all = [lift, squash, stretch, roll, tilt, headRot, headY, lookX, lookY, eyeClose, droop, follow];
    all.forEach(cancelAnimation);
    // Co nová reakce nepoužije, vrátí se do klidu (přerušená reakce dosedne, nezamrzne v půli).
    const used = new Set<SharedValue<number>>();
    const set = (v: SharedValue<number>, a: number) => { used.add(v); v.set(a); };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const ms = id ? OVERRIDES[id]?.ms : null;
    if (ms != null && key !== null) timers.push(setTimeout(() => setExpired(key), ms));
    // Salto mohlo skončit uprostřed otočky: úhel se srovná na nejbližší celou otáčku.
    roll.set(((roll.value % 360) + 540) % 360 - 180);

    switch (id) {
      case null:
        break;
      case 'hop': {
        const h = motion.hop;
        set(lift, withSequence(withTiming(0, t(h.crouchMs)), withTiming(-R.hop.height, t(h.riseMs)), withTiming(0, t(h.fallMs, ease.gravity))));
        set(squash, withSequence(
          withTiming(h.squash, t(h.crouchMs)), withTiming(0, t(h.riseMs)), withTiming(0, t(h.fallMs)),
          withTiming(h.squash, t(h.landMs)), withTiming(0, t(h.recoverMs)),
        ));
        break;
      }
      case 'flip':
      case 'joyJump': {
        const j = id === 'flip' ? R.flip : R.joyJump;
        set(lift, withSequence(withTiming(0, t(j.crouchMs)), withTiming(-j.height, t(j.riseMs)), withTiming(0, t(j.fallMs, ease.gravity))));
        set(squash, withSequence(
          withTiming(j.squash, t(j.crouchMs)), withTiming(-j.squash * 0.5, t(j.riseMs)), withTiming(0, t(j.fallMs)),
          withTiming(j.squash, t(j.landMs)), withSpring(0, back),
        ));
        if (id === 'flip') {
          // Salto dozadu kolem středu: otočka trvá celý let, 360° = 0°, takže návrat je neviditelný.
          set(roll, withSequence(
            withTiming(0, t(j.crouchMs)), withTiming(-360, t(j.riseMs + j.fallMs, Easing.inOut(Easing.cubic))), withTiming(0, { ...motion.instant, ...NEVER }),
          ));
        }
        break;
      }
      case 'cuddle': {
        const c = R.cuddle;
        set(eyeClose, withSequence(withTiming(1, t(c.inMs)), withDelay(c.holdMs, withTiming(0, t(c.inMs)))));
        if (!reduced) set(squash, withSequence(withTiming(c.squeeze, t(c.inMs)), withDelay(c.holdMs, withSpring(0, back))));
        break;
      }
      case 'gaze': {
        const G = R.gaze;
        set(lookX, withSequence(withTiming(0.9, t(G.glanceMs)), withDelay(G.holdMs, withTiming(0, t(G.glanceMs)))));
        if (!reduced) set(headRot, withSequence(withTiming(G.headDeg * 0.6, t(G.glanceMs)), withDelay(G.holdMs, withSpring(0, back))));
        break;
      }
      case 'lookDown':
        set(droop, withSequence(withTiming(1, { ...motion.moodShift, ...NEVER }), withDelay(R.lookDown.holdMs, withTiming(0, { ...motion.moodShift, ...NEVER }))));
        break;
      case 'dizzy': {
        const d = R.dizzy;
        const swings = Array.from({ length: d.swings }, (_, i) => withTiming((i % 2 ? -1 : 1) * d.deg * d.decay ** i, sine(d.swingMs)));
        set(headRot, withSequence(...swings, withSpring(0, back)));
        set(lookX, withSequence(...swings.map((_, i) => withTiming((i % 2 ? 1 : -1) * d.decay ** i, sine(d.swingMs))), withSpring(0, back)));
        break;
      }
      case 'sleep':
        set(eyeClose, withTiming(1, t(R.sleep.closeMs, ease.sine)));
        if (!reduced) set(headY, withTiming(R.sleep.headDip, t(R.sleep.closeMs, ease.sine)));
        break;
      case 'wave': {
        const w = R.wave;
        const swings = Array.from({ length: w.times * 2 }, (_, i) => withTiming((i % 2 ? -1 : 1) * w.deg, sine(i === 0 ? w.swingMs / 2 : w.swingMs)));
        set(tilt, withSequence(...swings, withSpring(0, back)));
        break;
      }
      case 'nod': {
        const n = R.nod;
        const beats = (to: number) => Array.from({ length: n.times }, () => [withTiming(to, t(n.downMs)), withTiming(0, t(n.upMs))]).flat();
        set(headY, withSequence(...beats(n.dip)));
        set(headRot, withSequence(...beats(-n.deg * 0.3)));
        set(lookY, withSequence(...beats(0.5)));
        break;
      }
      case 'celebrate':
        break;
      case 'proud': {
        const p = R.proud;
        // Omezený pohyb: hrdost zůstane jen v očích (pohled vzhůru), bez vypnutí a zdvihu.
        if (!reduced) {
          set(stretch, withSequence(withTiming(p.scale, t(p.inMs)), withDelay(p.holdMs, withSpring(0, back))));
          set(lift, withSequence(withTiming(-p.lift, t(p.inMs)), withDelay(p.holdMs, withSpring(0, back))));
        }
        set(lookY, withSequence(withTiming(-0.5, t(p.inMs)), withDelay(p.holdMs, withSpring(0, back))));
        break;
      }
      case 'sad': {
        const sd = R.sad;
        set(eyeClose, withSequence(withTiming(sd.sigh, t(sd.inMs, ease.sine)), withDelay(sd.holdMs - 2 * sd.inMs, withTiming(0, t(sd.inMs, ease.sine)))));
        if (!reduced) set(headY, withSequence(withTiming(sd.dip, t(sd.inMs, ease.sine)), withDelay(sd.holdMs - 2 * sd.inMs, withSpring(0, back))));
        break;
      }
      case 'shrug': {
        const sh = R.shrug;
        set(lift, withSequence(withTiming(-sh.lift, t(sh.upMs)), withDelay(sh.holdMs, withTiming(0, t(sh.downMs, ease.gravity)))));
        set(headRot, withSequence(withTiming(sh.deg, t(sh.upMs)), withDelay(sh.holdMs, withSpring(0, back))));
        set(lookX, withSequence(withTiming(-0.8, t(sh.upMs)), withDelay(sh.holdMs, withSpring(0, back))));
        break;
      }
      case 'spinFollow': {
        const f = R.spinFollow;
        set(follow, withSequence(withTiming(1, t(f.fadeMs)), withDelay(f.holdMs, withTiming(0, t(f.fadeMs)))));
        spinTravel.set(0);
        // Dlouhé roztočení: po doběhu sledování se jí zatočí hlava (kývání jako `dizzy`). Omezený pohyb sem nedojde (degrade).
        timers.push(setTimeout(() => {
          if (!isLongSpin(spinTravel.value, I.spinDizzyRad)) return;
          const d = R.dizzy;
          const swings = Array.from({ length: d.swings }, (_, i) => withTiming((i % 2 ? -1 : 1) * d.deg * d.decay ** i, sine(d.swingMs)));
          headRot.set(withSequence(...swings, withSpring(0, back)));
          lookX.set(withSequence(...swings.map((_, i) => withTiming((i % 2 ? 1 : -1) * d.decay ** i, sine(d.swingMs))), withSpring(0, back)));
        }, f.fadeMs + f.holdMs));
        break;
      }
    }
    for (const v of all) if (!used.has(v) && v.value !== 0) v.set(withTiming(0, t(motion.ui.duration)));
    return () => timers.forEach(clearTimeout);
    // Přehrává se jen novým klíčem (nebo přechodem do klidu); sdílené hodnoty jsou stabilní.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id]);

  useEffect(() => () => {
    for (const v of [lift, squash, stretch, roll, tilt, headRot, headY, lookX, lookY, eyeClose, droop, follow, gx, gy, spinTravel]) cancelAnimation(v);
  }, [lift, squash, stretch, roll, tilt, headRot, headY, lookX, lookY, eyeClose, droop, follow, gx, gy, spinTravel]);

  return { lift, squash, stretch, roll, tilt, eyeClose, droop, pupilX, pupilY, headProps, override, ref };
}
