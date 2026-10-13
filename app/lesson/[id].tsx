import { router, useLocalSearchParams } from 'expo-router';
import { markNavigation } from '@/lib/navGuard';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard, ExerciseTitle } from '@/components/lesson/ExerciseCard';
import { LessonCompleteScene } from '@/components/lesson/LessonCompleteScene';
import { LessonProgress } from '@/components/lesson/LessonProgress';
import { useHoldTimer } from '@/components/lesson/useHoldTimer';
import { PillButton, pillText } from '@/components/ui/PillButton';
import { LessonStepEnter } from '@/components/lesson/LessonStepEnter';
import { RestStep } from '@/components/lesson/RestStep';
import { splitTip } from '@/components/lesson/tip';
import { useRateLesson } from '@/hooks/useRateLesson';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { GuideBubble } from '@/components/mascot/GuideBubble';
import { useFinishSetup } from '@/hooks/useGoals';
import { useGuide } from '@/hooks/useGuide';
import { useLesson } from '@/hooks/useLesson';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useMascotAct, type MascotReaction } from '@/components/mascot';
import { eventToRepertoire } from '@/logic/mascotRepertoire';
import { now } from '@/lib/clock';
import { canSkip } from '@/logic/adaptive';
import { DEMO_BUILD } from '@/lib/demo';
import { nextFlowPhase, type FlowPhase } from '@/logic/lessonFlow';
import { services, type LessonResult } from '@/services';
import { useShort, useTheme, tabularNums } from '@/theme';
import type { CosmeticSlot, Exercise, MascotStage } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { IntentScrollView } from '@/components/dots';

const NO_COSMETICS: Partial<Record<CosmeticSlot, string>> = {};

/** Dialog „Ukončit lekci?“. RN Web `Alert` nic nezobrazí, proto na webu (jen dev náhled) `confirm`. */
function confirmQuit(onQuit: () => void, onStay: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(`${copy.lesson.quitTitle}\n${copy.lesson.quitBody}`)) onQuit(); else onStay();
    return;
  }
  Alert.alert(copy.lesson.quitTitle, copy.lesson.quitBody, [
    { text: copy.lesson.quitCancel, style: 'cancel', onPress: onStay },
    { text: copy.lesson.quitConfirm, style: 'destructive', onPress: onQuit },
  ], { cancelable: true, onDismiss: onStay });
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);
  const { c } = useTheme();
  // Nízký displej: kompaktní bublina průvodce (bez štítku) přes celou šířku, ať zabere co nejméně výšky.
  const short = useShort();
  const [phase, setPhase] = useState<FlowPhase>({ kind: 'exercise', index: 0 });
  const [result, setResult] = useState<LessonResult | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const [attemptId] = useState(() => `${id}-${now().getTime()}`); // jeden pokus = jedno id (idempotence)
  const completing = useRef(false);
  // Výsledek každého cviku (true = odcvičeno, false = přeskočeno).
  const [done, setDone] = useState<boolean[]>([]);
  const leaving = useRef(false);
  const profile = useProfile();
  const cosmetics = profile.status === 'ready' ? profile.data?.equipped ?? NO_COSMETICS : NO_COSMETICS;
  // Mini opička, která cvičí s tebou (repertoár): stage z profilu, po přeskoku na dalším cviku pokrčí rameny.
  const coachStage: MascotStage = useProfileStats(profile.status === 'ready' && Array.isArray(profile.data?.activity) ? profile.data : null)?.stage ?? 1;
  const [skippedInto, setSkippedInto] = useState<number | null>(null);
  // Demo: přeskočit jde každý cvik a přeskok se počítá jako odcvičený (lekce doběhne do oslavy, žádná slepá ulička).
  const demo = DEMO_BUILD || (profile.status === 'ready' && profile.data?.demo === true);
  // First run (elite fáze 1): průvodce na cviku a na oslavě, „Set your goals“ na oslavě.
  const lessonGuide = useGuide('lesson');
  const celebrationGuide = useGuide('celebration');
  const setup = useFinishSetup();

  const rate = useRateLesson(attemptId);
  // Pauza mezi cviky (UX pass U1) jen po odcvičeném cviku: přeskok (demo i canSkip) jde rovnou na další cvik.
  const advance = useCallback(async (didIt: boolean = true, skipped = false) => {
    if (lesson.status !== 'ready' || phase.kind !== 'exercise') return;
    const outcome = [...done.slice(0, phase.index), didIt];
    setDone(outcome);
    const next = nextFlowPhase(phase, lesson.data.exercises.length, !skipped);
    if (next.kind !== 'completing') { setPhase(next); return; }
    if (completing.current) return; // dvojí tap na „Hotovo“ (Review Focus 3)
    completing.current = true;
    setPhase(next);
    try {
      setResult(await services.lessons.completeLesson(id, attemptId, now(), outcome));
      setPhase({ kind: 'celebrate' });
    } catch {
      completing.current = false;
      setPhase({ kind: 'exercise', index: lesson.data.exercises.length - 1 });
      Alert.alert(copy.common.loadError(copy.common.loadTarget.lessonResult), undefined, [{ text: copy.common.retry }]);
    }
  }, [phase, lesson, id, attemptId, done]);

  // Pokračovat z oslavy: zpět na mapu (pod modalem), s id odemčeného uzlu pro unlock sekvenci.
  // Cesta `/(tabs)`, ne `/`: přesměrování z indexu by query zahodilo (Ruling R22). Dvojí tap hlídá ref.
  const onContinue = useCallback((r: LessonResult) => {
    if (leaving.current) return;
    leaving.current = true;
    markNavigation();
    // Task 26: přechod na vyšší stage vede přes oslavu růstu, ta pak pokračuje stejně na mapu.
    if (r.stageAfter > r.stageBefore) {
      router.replace({ pathname: '/stage-up', params: { from: String(r.stageBefore), to: String(r.stageAfter), unlocked: r.unlockedLessonId ?? '' } });
      return;
    }
    router.dismissTo({ pathname: '/(tabs)', params: r.unlockedLessonId ? { unlocked: r.unlockedLessonId } : {} });
  }, []);

  // Deep link nemá historii: `router.back()` by pak neudělal nic (QA kolo 1).
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back(); else router.replace('/(tabs)');
  }, []);

  const askQuit = useCallback(() => {
    setQuitOpen(true);
    confirmQuit(goBack, () => setQuitOpen(false));
  }, [goBack]);

  // Hardwarové Zpět na Androidu během cviků otevře stejný dialog; při ukládání a oslavě se ignoruje.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase.kind === 'exercise' || phase.kind === 'rest') askQuit();
      return true;
    });
    return () => sub.remove();
  }, [phase.kind, askQuit]);

  if (lesson.status === 'error') return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.retry} />;
  if (lesson.status !== 'ready') return <DotLoaderScreen />;
  // Zamčený uzel otevřený deep linkem: nesmí se ani rozjet, ne až selhat na konci (QA kolo 1).
  if (lesson.data.state === 'locked') {
    return <ErrorState message={copy.lesson.locked} actionLabel={copy.lesson.backToMap} onRetry={goBack} />;
  }
  const { exercises } = lesson.data;

  const endRest = () => setPhase((p) => (p.kind === 'rest' ? nextFlowPhase(p, exercises.length) : p));

  if (phase.kind === 'celebrate' && result) {
    return (
      <LessonCompleteScene
        result={result} lesson={lesson.data.lesson} cosmetics={cosmetics}
        onContinue={() => { celebrationGuide.dismiss(); onContinue(result); }}
        onRate={rate}
        guide={celebrationGuide.id ? { id: celebrationGuide.id, dismiss: celebrationGuide.dismiss } : undefined}
        // Mapa zůstává pod modalem: „Finish setup“ nahradí oslavu, Zpět/Done z něj vrátí na mapu.
        onSetGoals={setup.needed ? () => { celebrationGuide.dismiss(); if (leaving.current) return; leaving.current = true; markNavigation(); router.replace('/setup'); } : undefined}
      />
    );
  }

  if (phase.kind === 'rest') {
    const upcoming = exercises[phase.next];
    if (!upcoming) return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.refresh} />;
    return (
      <ReactiveBackground style={{ backgroundColor: c.base }}>
        <Screen edges={[]} transparent>
          <LessonProgress total={exercises.length} current={phase.next} onClose={askQuit} />
          <RestStep key={`rest-${phase.next}`} next={upcoming} onContinue={endRest} coach={{ stage: coachStage, cosmetics }} />
        </Screen>
      </ReactiveBackground>
    );
  }

  const index = phase.kind === 'exercise' ? phase.index : exercises.length - 1;
  const exercise = exercises[index];
  if (!exercise) return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.refresh} />;
  const following = exercises[index + 1];

  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
      {/* Horní safe area odsazuje LessonProgress sám (fullScreenModal na iOS, viz komentář tam). */}
      <Screen edges={[]} transparent>
        <LessonProgress total={exercises.length} current={index} onClose={askQuit} />
        <ExerciseStep
          key={exercise.id + index}
          enter={index > 0}
          exercise={exercise}
          busy={phase.kind !== 'exercise'}
          suspended={quitOpen}
          extra={lesson.data.extras[index] ?? 0}
          next={following}
          onDone={() => { lessonGuide.dismiss(); void advance(true); }}
          guide={lessonGuide.id ? <GuideBubble id={lessonGuide.id} text={exercise.type === 'reps' ? copy.guide.lessonReps : copy.guide.lessonHold} arrow="down" align="end" compact={short} stretch={short} onDismiss={lessonGuide.dismiss} /> : null}
          onAct={lessonGuide.dismiss}
          alwaysSkip={demo}
          coach={{ stage: coachStage, cosmetics, skipped: skippedInto === index }}
          // Přeskok: chování beze změny (demo drží boss), jen se poznamená, kam se přeskočilo (pokrčení ramen mini opičky).
          onSkip={demo ? () => { setSkippedInto(index + 1); void advance(true, true); } : canSkip(done, index, exercises.length) ? () => { setSkippedInto(index + 1); void advance(false, true); } : undefined}
        />
      </Screen>
    </ReactiveBackground>
  );
}

interface StepProps {
  exercise: Exercise;
  /** Krok přichází po pauze / předchozím cviku: obsah nastoupí (motion U1). */
  enter?: boolean;
  /** Výsledek se ukládá: lišta je neaktivní. */
  busy: boolean;
  /** Otevřený dialog ukončení: běžící výdrž se pauzne. */
  suspended: boolean;
  /** O kolik je cvik navýšený z dluhu přeskočených cviků (0 = beze změny). */
  extra: number;
  /** Další cvik lekce (řádek „Next up“); chybí u posledního = „Last one“. */
  next?: Exercise;
  onDone(): void;
  /** Přeskočení cviku; chybí, když by se lekce už nezapočítala (logic/adaptive canSkip). */
  onSkip?: () => void;
  /** Demo: přeskočit jde i během odpočtu a běžícího časovače. */
  alwaysSkip?: boolean;
  /** Opička průvodce (first run): bublina v obsahu nad patičkou, šipka dolů k [DONE]/[START]. */
  guide?: ReactNode;
  /** Jakákoli akce v liště (start, hotovo, pauza) = průvodce splnil účel a zmizí. */
  onAct?: () => void;
  /** Mini opička (repertoár `trainAlong`): vzhled a zda se sem přišlo přeskokem (pokrčí rameny). */
  coach?: { stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>>; skipped: boolean };
}

/**
 * Jeden cvik (UX pass U1). Nahoře se scrolluje karta (silueta, číslo, název, zbytek popisu, caution). Dole pevná
 * patička, která se nikdy neodroluje: 0) název (+ CAUTION), 1) tip techniky (první věta popisu) — to si cvičenec čte uprostřed série,
 * 2) řádek „Next up: … · …“ / „Last one“ s tichou textovou akcí [SKIP] vpravo (mimo hlavní palec),
 * 3) velké [DONE] / [START] přes celou šířku, 64 pt. Klíčovaný cvikem, odpočet výdrže začíná pro každý cvik znovu.
 */
function ExerciseStep({ exercise, enter = false, busy, suspended, extra, next, onDone, onSkip, alwaysSkip = false, guide, onAct, coach }: StepProps) {
  const { c, space, size } = useTheme();
  const short = useShort();
  const insets = useSafeAreaInsets();
  const hold = exercise.type === 'hold';
  const timer = useHoldTimer(hold ? exercise.amount : 0, onDone);
  const { pause } = timer;
  useEffect(() => { if (suspended) pause(); }, [suspended, pause]);
  const { tip } = splitTip(exercise.description);
  // Mini opička: posledních 3 s výdrže se zatne (`holdRemaining` → strain), jednou za cvik.
  const acts = useMascotAct();
  const { play } = acts;
  const strained = useRef(false);
  const holdMs = hold && timer.status === 'running' ? timer.secondsLeft * 1000 : 0;
  useEffect(() => {
    if (holdMs <= 0 || strained.current) return;
    const id = eventToRepertoire({ type: 'holdRemaining', ms: holdMs });
    if (id) strained.current = play(id);
  }, [holdMs, play]);
  const [shrug] = useState<MascotReaction | null>(() => (coach?.skipped ? { id: 'shrug', key: 1 } : null));

  const primary = !hold
    ? { label: copy.common.done, onPress: onDone }
    : timer.status === 'running' || timer.status === 'countdown'
      ? { label: copy.common.pause, onPress: timer.pause }
      : timer.status === 'paused'
        ? { label: copy.common.resume, onPress: timer.start }
        : { label: copy.common.start, onPress: timer.start };
  // Přeskočit jen před startem výdrže nebo u opakování; běžící výdrž se nejdřív pauzne.
  const skip = onSkip && !busy && (alwaysSkip || (timer.status !== 'running' && timer.status !== 'countdown' && timer.status !== 'done'))
    ? () => { pause(); onSkip(); } : undefined;
  const nextLine = next ? copy.lesson.nextUp(next.name, copy.lesson.dose(next.amount, next.type === 'hold')) : copy.lesson.lastOne;

  return (
    <>
      {/* Nástup po pauze (U1): obsah přijede zprava, patička s [DONE] stojí. První cvik stojí hned. */}
      <LessonStepEnter play={enter} style={{ flex: 1, marginHorizontal: -space.l }}>
      <IntentScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.l, paddingTop: short ? space.s : space.l, paddingBottom: short ? space.s : space.l }}>
        <ExerciseCard
          exercise={exercise} timer={hold ? timer : undefined} guided={!!guide} tipOutside still={!!suspended || timer.status === 'paused'}
          coach={coach ? { stage: coach.stage, cosmetics: coach.cosmetics, act: acts.act, reaction: shrug } : undefined}
        />
        {extra > 0 ? <Text variant="caption" tone="muted" style={[tabularNums, { marginTop: space.s }]}>{copy.lesson.extra(extra, hold)}</Text> : null}
        {/* Bublina průvodce je součástí obsahu: nezmenšuje patičku a nikdy nekryje tip ani [DONE]. */}
        {guide ? <View style={{ marginTop: short ? space.s : space.m }}>{guide}</View> : null}
      </IntentScrollView>
      </LessonStepEnter>
      <View
        testID="exercise-footer"
        style={{
          marginHorizontal: -space.l, paddingHorizontal: space.l, paddingTop: short ? space.s : space.m,
          paddingBottom: insets.bottom + (short ? space.s : space.m), gap: short ? space.xs : space.s,
          backgroundColor: c.base, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule,
        }}
      >
        <ExerciseTitle exercise={exercise} />
        <Text testID="exercise-tip" variant={short ? 'caption' : 'body'} accessibilityLabel={copy.lesson.tipA11y(tip)}>{tip}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: size.hit }}>
          <Text testID="exercise-next" variant="caption" tone="muted" numberOfLines={1} style={[tabularNums, { flex: 1 }]}>{nextLine}</Text>
          {skip ? (
            <Pressable
              onPress={skip}
              accessibilityRole="button"
              accessibilityLabel={copy.lesson.skip}
              style={{ minHeight: size.hit, minWidth: size.hit, alignItems: 'flex-end', justifyContent: 'center' }}
            >
              {({ pressed }) => <Text variant="pill" tone={pressed ? 'text' : 'muted'}>{pillText(copy.lesson.skip)}</Text>}
            </Pressable>
          ) : null}
        </View>
        <PillButton
          large
          label={primary.label}
          onPress={() => { onAct?.(); primary.onPress(); }}
          disabled={busy || timer.status === 'done'}
        />
      </View>
    </>
  );
}
