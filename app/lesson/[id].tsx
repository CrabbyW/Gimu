import { router, useLocalSearchParams } from 'expo-router';
import { markNavigation } from '@/lib/navGuard';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Platform, View } from 'react-native';
import { ExerciseCard } from '@/components/lesson/ExerciseCard';
import { LessonCompleteScene } from '@/components/lesson/LessonCompleteScene';
import { LessonProgress } from '@/components/lesson/LessonProgress';
import { useHoldTimer } from '@/components/lesson/useHoldTimer';
import { BigActionBar } from '@/components/ui/BigActionBar';
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
import { now } from '@/lib/clock';
import { canSkip } from '@/logic/adaptive';
import { nextPhase, type LessonPhase } from '@/logic/lessonFlow';
import { services, type LessonResult } from '@/services';
import { useTheme } from '@/theme';
import type { CosmeticSlot, Exercise } from '@/types';
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
  const [phase, setPhase] = useState<LessonPhase>({ kind: 'exercise', index: 0 });
  const [result, setResult] = useState<LessonResult | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const [attemptId] = useState(() => `${id}-${now().getTime()}`); // jeden pokus = jedno id (idempotence)
  const completing = useRef(false);
  // Výsledek každého cviku (true = odcvičeno, false = přeskočeno).
  const [done, setDone] = useState<boolean[]>([]);
  const leaving = useRef(false);
  const profile = useProfile();
  const cosmetics = profile.status === 'ready' ? profile.data?.equipped ?? NO_COSMETICS : NO_COSMETICS;
  // Demo: přeskočit jde každý cvik a přeskok se počítá jako odcvičený (lekce doběhne do oslavy, žádná slepá ulička).
  const demo = profile.status === 'ready' && profile.data?.demo === true;
  // First run (elite fáze 1): průvodce na cviku a na oslavě, „Set your goals“ na oslavě.
  const lessonGuide = useGuide('lesson');
  const celebrationGuide = useGuide('celebration');
  const setup = useFinishSetup();

  const advance = useCallback(async (didIt: boolean = true) => {
    if (lesson.status !== 'ready' || phase.kind !== 'exercise') return;
    const outcome = [...done.slice(0, phase.index), didIt];
    setDone(outcome);
    const next = nextPhase(phase, lesson.data.exercises.length);
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
      if (phase.kind === 'exercise') askQuit();
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

  if (phase.kind === 'celebrate' && result) {
    return (
      <LessonCompleteScene
        result={result} lesson={lesson.data.lesson} cosmetics={cosmetics}
        onContinue={() => { celebrationGuide.dismiss(); onContinue(result); }}
        guide={celebrationGuide.id ? { id: celebrationGuide.id, dismiss: celebrationGuide.dismiss } : undefined}
        // Mapa zůstává pod modalem: „Finish setup“ nahradí oslavu, Zpět/Done z něj vrátí na mapu.
        onSetGoals={setup.needed ? () => { celebrationGuide.dismiss(); if (leaving.current) return; leaving.current = true; markNavigation(); router.replace('/setup'); } : undefined}
      />
    );
  }

  const index = phase.kind === 'exercise' ? phase.index : exercises.length - 1;
  const exercise = exercises[index];
  if (!exercise) return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.refresh} />;

  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
      {/* Horní safe area odsazuje LessonProgress sám (fullScreenModal na iOS, viz komentář tam). */}
      <Screen edges={[]} transparent>
        <LessonProgress total={exercises.length} current={index} onClose={askQuit} />
        <ExerciseStep
          key={exercise.id + index}
          exercise={exercise}
          busy={phase.kind !== 'exercise'}
          suspended={quitOpen}
          extra={lesson.data.extras[index] ?? 0}
          onDone={() => { lessonGuide.dismiss(); void advance(true); }}
          guide={lessonGuide.id ? <GuideBubble id={lessonGuide.id} arrow="down" align="end" onDismiss={lessonGuide.dismiss} /> : null}
          onAct={lessonGuide.dismiss}
          alwaysSkip={demo}
          onSkip={demo ? () => void advance(true) : canSkip(done, index, exercises.length) ? () => void advance(false) : undefined}
        />
      </Screen>
    </ReactiveBackground>
  );
}

interface StepProps {
  exercise: Exercise;
  /** Výsledek se ukládá: lišta je neaktivní (ve fázi 2 zde přibude loading). */
  busy: boolean;
  /** Otevřený dialog ukončení: běžící výdrž se pauzne. */
  suspended: boolean;
  /** O kolik je cvik navýšený z dluhu přeskočených cviků (0 = beze změny). */
  extra: number;
  onDone(): void;
  /** Přeskočení cviku; chybí, když by se lekce už nezapočítala (logic/adaptive canSkip). */
  onSkip?: () => void;
  /** Demo: přeskočit jde i během odpočtu a běžícího časovače. */
  alwaysSkip?: boolean;
  /** Opička průvodce (first run): bublina nad lištou, šipka dolů k [DONE]/[START]. Nepřekrývá lištu, sedí nad ní. */
  guide?: ReactNode;
  /** Jakákoli akce v liště (start, hotovo, pauza) = průvodce splnil účel a zmizí. */
  onAct?: () => void;
}

/** Jeden cvik: karta a spodní lišta. Klíčovaný cvikem, takže odpočet výdrže začíná pro každý cvik znovu. */
function ExerciseStep({ exercise, busy, suspended, extra, onDone, onSkip, alwaysSkip = false, guide, onAct }: StepProps) {
  const { space } = useTheme();
  const hold = exercise.type === 'hold';
  const timer = useHoldTimer(hold ? exercise.amount : 0, onDone);
  const { pause } = timer;
  useEffect(() => { if (suspended) pause(); }, [suspended, pause]);

  const primary = !hold
    ? { label: copy.common.done, onPress: onDone }
    : timer.status === 'running' || timer.status === 'countdown'
      ? { label: copy.common.pause, onPress: timer.pause }
      : timer.status === 'paused'
        ? { label: copy.common.resume, onPress: timer.start }
        : { label: copy.common.start, onPress: timer.start };

  return (
    <>
      <IntentScrollView style={{ flex: 1, marginHorizontal: -space.l }} contentContainerStyle={{ paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.xl }}>
        <ExerciseCard exercise={exercise} timer={hold ? timer : undefined} />
        {extra > 0 ? <Text variant="caption" tone="muted" style={{ marginTop: space.s }}>{copy.lesson.extra(extra, hold)}</Text> : null}
      </IntentScrollView>
      {guide ? <View style={{ paddingTop: space.s }}>{guide}</View> : null}
      <View style={{ marginHorizontal: -space.l }}>
        <BigActionBar
          primary={{ ...primary, onPress: () => { onAct?.(); primary.onPress(); }, disabled: busy || timer.status === 'done' }}
          // Přeskočit jen před startem výdrže nebo u opakování; běžící výdrž se nejdřív pauzne.
          secondary={onSkip && !busy && (alwaysSkip || (timer.status !== 'running' && timer.status !== 'countdown' && timer.status !== 'done'))
            ? { label: copy.lesson.skip, onPress: () => { pause(); onSkip(); } } : undefined}
        />
      </View>
    </>
  );
}
