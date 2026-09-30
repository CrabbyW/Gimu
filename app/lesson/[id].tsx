import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, ScrollView, View } from 'react-native';
import { ExerciseCard } from '@/components/lesson/ExerciseCard';
import { LessonCompleteScene } from '@/components/lesson/LessonCompleteScene';
import { LessonProgress } from '@/components/lesson/LessonProgress';
import { useHoldTimer } from '@/components/lesson/useHoldTimer';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { copy } from '@/data/copy';
import { useLesson } from '@/hooks/useLesson';
import { useProfile } from '@/hooks/useProfile';
import { now } from '@/lib/clock';
import { nextPhase, type LessonPhase } from '@/logic/lessonFlow';
import { services, type LessonResult } from '@/services';
import { useTheme } from '@/theme';
import type { CosmeticSlot, Exercise } from '@/types';

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
  const leaving = useRef(false);
  const profile = useProfile();
  const cosmetics = profile.status === 'ready' ? profile.data?.equipped ?? NO_COSMETICS : NO_COSMETICS;

  const advance = useCallback(async () => {
    if (lesson.status !== 'ready') return;
    const next = nextPhase(phase, lesson.data.exercises.length);
    if (next.kind !== 'completing') { setPhase(next); return; }
    if (completing.current) return; // dvojí tap na „Hotovo“ (Review Focus 3)
    completing.current = true;
    setPhase(next);
    try {
      setResult(await services.lessons.completeLesson(id, attemptId, now()));
      setPhase({ kind: 'celebrate' });
    } catch {
      completing.current = false;
      setPhase({ kind: 'exercise', index: lesson.data.exercises.length - 1 });
      Alert.alert(copy.common.loadError(copy.common.loadTarget.lessonResult), undefined, [{ text: copy.common.retry }]);
    }
  }, [phase, lesson, id, attemptId]);

  // Pokračovat z oslavy: zpět na mapu (pod modalem), s id odemčeného uzlu pro unlock sekvenci.
  // Cesta `/(tabs)`, ne `/`: přesměrování z indexu by query zahodilo (Ruling R22). Dvojí tap hlídá ref.
  const onContinue = useCallback((r: LessonResult) => {
    if (leaving.current) return;
    leaving.current = true;
    router.dismissTo({ pathname: '/(tabs)', params: r.unlockedLessonId ? { unlocked: r.unlockedLessonId } : {} });
  }, []);

  const askQuit = useCallback(() => {
    setQuitOpen(true);
    confirmQuit(() => router.back(), () => setQuitOpen(false));
  }, []);

  // Hardwarové Zpět na Androidu během cviků otevře stejný dialog; při ukládání a oslavě se ignoruje.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase.kind === 'exercise') askQuit();
      return true;
    });
    return () => sub.remove();
  }, [phase.kind, askQuit]);

  if (lesson.status === 'error') return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.retry} />;
  if (lesson.status !== 'ready') return <View style={{ flex: 1, backgroundColor: c.base }} />;
  const { exercises } = lesson.data;

  if (phase.kind === 'celebrate' && result) {
    return <LessonCompleteScene result={result} lesson={lesson.data.lesson} cosmetics={cosmetics} onContinue={() => onContinue(result)} />;
  }

  const index = phase.kind === 'exercise' ? phase.index : exercises.length - 1;
  const exercise = exercises[index];
  if (!exercise) return <ErrorState what={copy.common.loadTarget.lesson} onRetry={lesson.refresh} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <Screen edges={['top']}>
        <LessonProgress total={exercises.length} current={index} onClose={askQuit} />
        <ExerciseStep
          key={exercise.id + index}
          exercise={exercise}
          busy={phase.kind !== 'exercise'}
          suspended={quitOpen}
          onDone={advance}
        />
      </Screen>
    </View>
  );
}

interface StepProps {
  exercise: Exercise;
  /** Výsledek se ukládá: lišta je neaktivní (ve fázi 2 zde přibude loading). */
  busy: boolean;
  /** Otevřený dialog ukončení: běžící výdrž se pauzne. */
  suspended: boolean;
  onDone(): void;
}

/** Jeden cvik: karta a spodní lišta. Klíčovaný cvikem, takže odpočet výdrže začíná pro každý cvik znovu. */
function ExerciseStep({ exercise, busy, suspended, onDone }: StepProps) {
  const { space } = useTheme();
  const hold = exercise.type === 'hold';
  const timer = useHoldTimer(hold ? exercise.amount : 0, onDone);
  const { pause } = timer;
  useEffect(() => { if (suspended) pause(); }, [suspended, pause]);

  const primary = !hold
    ? { label: copy.common.done, onPress: onDone }
    : timer.status === 'running'
      ? { label: copy.common.pause, onPress: timer.pause }
      : timer.status === 'paused'
        ? { label: copy.common.resume, onPress: timer.start }
        : { label: copy.common.start, onPress: timer.start };

  return (
    <>
      <ScrollView style={{ flex: 1, marginHorizontal: -space.l }} contentContainerStyle={{ paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.xl }}>
        <ExerciseCard exercise={exercise} timer={hold ? timer : undefined} />
      </ScrollView>
      <View style={{ marginHorizontal: -space.l }}>
        <BigActionBar primary={{ ...primary, disabled: busy || timer.status === 'done' }} />
      </View>
    </>
  );
}
