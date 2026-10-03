import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Mascot } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { celebration, ease, motion, useMotionSafe } from '@/lib/motion';
import { useClickSound } from '@/lib/sound';
import type { LessonResult } from '@/services';
import { PHI, useCompact, useTheme } from '@/theme';
import type { CosmeticSlot, Lesson, Mood } from '@/types';
import { Barbell, type BarbellMotion, type PlateFlight } from './Barbell';
import { AXIS, barbellLayout, COLLAR_TRAVEL, splitPlates, xpBreakdownLabel } from './celebration';
import { GoldenFigure } from './GoldenFigure';
import { XpPop } from './XpPop';

const t = copy.complete;
const XP_LABELS = { lesson: t.xpLesson, boss: t.xpBoss, replay: t.xpReplay, first: t.xpFirst, streak: t.xpStreak };

// Časová osa oslavy je v `lib/motion` (`celebration`): start kotouče od zobrazení scény, zbytek od dopadu.
// UX2 takty (brag `cinematic`: každý úder dosedne, než přijde další): dopad (žár emberu, úder, cvak) →
// +XP slam (120) → opice + Success (480, když count-up dojíždí) → titulek (760) → CTA (1000).
const { launch: LAUNCH_AT, leftLag: LEFT_LAG, xp: XP_AFTER_IMPACT, cheer: CHEER_AFTER_IMPACT, title: TITLE_AFTER_IMPACT, cta: CTA_AFTER_IMPACT } = celebration;
const TITLE_RISE = 12;
// CTA vyjede zespodu (jako zrození). Nezprůhledňuje se: poloprůhledný akcent by byl nový odstín.
const CTA_TRAVEL = 160;
// Odkud kotouč přilétá (pravá strana; levá zrcadlově).
const FROM = { x: 140, rotate: 18 };
const COLLAR_MS = 120;
// Osa se po dopadu prohne o 3 pt dolů a pružinou (motion.rattle) vrátí.
const SHAKE_DEPTH = 3;
// Omezený pohyb (spec §6.7): místo pružin se konečný stav jen prolne.
const REDUCED_FADE = motion.calmFade;

interface Props {
  result: LessonResult;
  lesson: Lesson;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  onContinue(): void;
}

/** Oslava dokončení lekce: kotouč přiletí na osu a zacvakne, +XP, opice se raduje.
 *  Výsledek je uložený dřív, než scéna začne; animace ho jen ukazuje. */
export function LessonCompleteScene({ result, lesson, cosmetics, onContinue }: Props) {
  const { c, space } = useTheme();
  const { width } = useWindowDimensions();
  const compact = useCompact();
  const contentWidth = width - 2 * space.l;
  const { reduced } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [calm] = useState(reduced);
  const [mood, setMood] = useState<Mood>('idle');
  const [xpShown, setXpShown] = useState(false);
  const [figureDrawn, setFigureDrawn] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const impacted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [layout] = useState(() => {
    const { loaded, flying } = splitPlates(result.completedPlates, lesson.plateKg);
    return barbellLayout(loaded, flying, (width - 2 * space.l) / 2);
  });
  // R43 §3: největší kružnice figury má průměr (šířka obsahu)/φ; na 320 pt o stupeň φ menší, aby
  // vlasové linky zůstaly v pásu činky a nesahaly do titulku ani do XP.
  // Průměr největší kružnice = šířka/φ, ale nejvýš výška pásu činky (R ≤ AXIS.mid), aby figura
  // na běžných šířkách nesahala k titulku nad činkou (QA R43 kolo 1).
  const figureR = Math.min(contentWidth / PHI / 2 / (compact ? PHI : 1), AXIS.mid);
  const figureCx = contentWidth / 2 + layout.flying.offset + layout.flying.w / 2;
  const cheer: Mood = lesson.isBoss || result.stageAfter > result.stageBefore ? 'celebrate' : 'happy';
  const title = result.xp.baseKind === 'replay' ? t.replayTitle : t.title;

  const sceneOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const shake = useSharedValue(0);
  const punch = useSharedValue(1);
  const ctaIn = useSharedValue(0);
  const start = calm ? { x: 0, rotate: 0 } : FROM;
  const startDrop = calm ? 1 : 0;
  // S omezeným pohybem jsou objímky na místě od začátku (součást osy), kotouč se jen prolne.
  const startCollar = calm ? 0 : COLLAR_TRAVEL;
  const right: PlateFlight = {
    drop: useSharedValue(startDrop), seat: useSharedValue(0), x: useSharedValue(start.x), rotate: useSharedValue(start.rotate), collar: useSharedValue(startCollar), heat: useSharedValue(0),
  };
  const left: PlateFlight = {
    drop: useSharedValue(startDrop), seat: useSharedValue(0), x: useSharedValue(-start.x), rotate: useSharedValue(-start.rotate), collar: useSharedValue(startCollar), heat: useSharedValue(0),
  };
  const bar: BarbellMotion = { right, left, opacity: useSharedValue(calm ? 0 : 1) };
  const click = useClickSound();

  // Dopad pravého kotouče (první dotek osy): úder, cvak zámku, rozkmit osy a odpočet odměn.
  const onImpact = () => {
    if (impacted.current) return;
    impacted.current = true;
    setFigureDrawn(true);
    haptics.impact();
    click();
    if (!calm) {
      shake.set(withSequence(withTiming(SHAKE_DEPTH, { duration: 50 }), withSpring(0, motion.rattle)));
      // Punch „kamery“: celá scéna se na 60 ms nadechne (1.018) a rozhodně vrátí (brag cinematic slam).
      punch.set(withSequence(withTiming(motion.punch.scale, { duration: motion.punch.inMs, easing: ease.out }), withTiming(1, motion.release)));
    }
    const at = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
    at(XP_AFTER_IMPACT, () => setXpShown(true));
    at(CHEER_AFTER_IMPACT, () => { setMood(cheer); haptics.success(); });
    at(TITLE_AFTER_IMPACT, () => { titleOpacity.set(withTiming(1, calm ? REDUCED_FADE : motion.enter)); });
    at(CTA_AFTER_IMPACT, () => { setCtaReady(true); ctaIn.set(withTiming(1, calm ? REDUCED_FADE : motion.reveal)); });
  };

  useEffect(() => {
    sceneOpacity.set(withTiming(1, calm ? REDUCED_FADE : motion.reveal));
    if (calm) {
      bar.opacity.set(withDelay(LAUNCH_AT, withTiming(1, REDUCED_FADE, (fin) => { if (fin) scheduleOnRN(onImpact); })));
    } else {
      // Oblouk: svisle zrychlující pád (motion.fall), vodorovně a rotačně dobíhá (ease-out) stejně dlouho.
      // V okamžiku dotyku (konec pádu, UI vlákno) převezme pohyb dosednutí `seat` s rychlostí dopadu
      // a objímka té strany dojede a objeví se. Pravý kotouč spouští dopad (haptika, zvuk, odměny).
      const fly = (side: PlateFlight, delay: number, lead: boolean) => {
        side.drop.set(withDelay(delay, withTiming(1, motion.fall, (done) => {
          if (!done) return;
          side.seat.set(withSpring(0, motion.seat));
          side.collar.set(withTiming(0, { duration: COLLAR_MS, easing: motion.ui.easing }));
          // Ember přichází jako událost: v rámu dotyku (UI vlákno, stejný snímek jako úder) se kotouč
          // rozžhaví a chladne do oceli; +XP v emberu barvu převezme o 120 ms později.
          side.heat.set(withSequence(withTiming(celebration.heat.peak, { duration: 0 }), withTiming(0, { duration: celebration.heat.coolMs, easing: ease.out })));
          if (lead) scheduleOnRN(onImpact);
        })));
        side.x.set(withDelay(delay, withTiming(0, { duration: motion.fall.duration, easing: motion.ui.easing })));
        side.rotate.set(withDelay(delay, withTiming(0, { duration: motion.fall.duration, easing: motion.ui.easing })));
      };
      fly(right, LAUNCH_AT, true);
      fly(left, LAUNCH_AT + LEFT_LAG, false);
    }
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
    // Sekvence běží jednou při vstupu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shake.value }] }));
  const punchStyle = useAnimatedStyle(() => ({ transform: [{ scale: punch.value }] }));
  const titleRise = calm ? 0 : TITLE_RISE;
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: (1 - titleOpacity.value) * titleRise }] }));
  const ctaStyle = useAnimatedStyle(() => (calm
    ? { opacity: ctaIn.value }
    : { transform: [{ translateY: (1 - ctaIn.value) * CTA_TRAVEL }] }));

  return (
    <View style={{ flex: 1, backgroundColor: c.base, overflow: 'hidden' }}>
      <Animated.View style={[{ flex: 1 }, sceneStyle, punchStyle]}>
        <Screen edges={['top']}>
          {/* Na 320 pt o stupeň menší titulek a těsnější rytmus: display by se zalomil a střed by
              přetekl nahoru přes titulek. Titulek i střed jsou v toku, nic se nepřekrývá. */}
          <Animated.View style={[{ paddingTop: compact ? space.l : space.xl }, titleStyle]}>
            <Text variant={compact ? 'title' : 'display'} accessibilityRole="header">{title}</Text>
          </Animated.View>
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: compact ? space.m : space.xl }}>
            <Animated.View style={[{ marginBottom: compact ? space.l : space.xl }, shakeStyle]}>
              <GoldenFigure r={figureR} cx={figureCx} cy={AXIS.mid} drawn={figureDrawn} calm={calm} />
              <Barbell width={contentWidth} layout={layout} motion={bar} />
            </Animated.View>
            {/* Opice stojí vpravo u čísla, které právě vydřela: odměna a její svědek v jednom pohledu.
                Je v toku řádku (ne absolutně), velikost čísla i opice rozpočítá XpPop i se slamem 1.2. */}
            <XpPop
              total={result.xp.total}
              breakdown={xpBreakdownLabel(result.xp, XP_LABELS)}
              shown={xpShown}
              calm={calm}
              width={contentWidth}
              aside={(px) => <Mascot stage={result.stageBefore} cosmetics={cosmetics} mood={mood} size={px} />}
            />
          </View>
        </Screen>
      </Animated.View>
      {/* CTA nastoupí až po odměně (spec §7.3 krok 7); místo je rezervované, layout se nehýbe. */}
      <Animated.View style={ctaStyle}>
        <BigActionBar primary={{ label: t.cta, onPress: onContinue, disabled: !ctaReady }} />
      </Animated.View>
    </View>
  );
}
