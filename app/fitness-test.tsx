import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotRing, IntentScrollView } from '@/components/dots';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { DotSteps } from '@/components/ui/DotSteps';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { Toggle } from '@/components/ui/Toggle';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { useSaveFitnessTest } from '@/hooks/useFitnessTest';
import { plankRingProgress, useStopwatch } from '@/hooks/useStopwatch';
import { feedback } from '@/lib/feedback';
import { fitnessTest, stepEnterTiming, useMotionSafe } from '@/lib/motion';
import { FITNESS, READINESS_QUESTIONS, readiness, scaleFromTest } from '@/logic/fitnessTest';
import { useTheme } from '@/theme';

const t = copy.fitness;
const STEPS = 4;
type Step = 0 | 1 | 2 | 3;
type Answer = 'yes' | 'no';
const YES_NO = [{ value: 'no' as const, label: t.no }, { value: 'yes' as const, label: t.yes }];
/** Krok tlačítek ± u planku (s). */
const PLANK_STEP = 5;

/** Zavřít test: modal zpět, při přímém otevření (deep link, reload) na mapu. */
function close() {
  if (router.canGoBack()) router.back(); else router.replace('/');
}

/**
 * Vstupní test úrovně (elite fáze 5, spec docs/superpowers/specs/2026-10-08-elite-faze5-vstupni-test-design.md).
 * Čtyři kroky v jednom modalu: připravenost (7 otázek ano/ne, „ano“ jen upozorní) → kliky → plank → výsledek.
 * Hierarchie: v testových krocích je hlavní obří Doto číslo (to, co cvičenec zadává), v kroku výsledku věta
 * o škálování. Přeskočit jde kdykoli (křížek v hlavičce, v prvním kroku i lišta) a nechá výchozí dávky.
 * Disclaimer leží na konci obsahu každého kroku.
 */
export default function FitnessTestScreen() {
  const { c, space, radius, size } = useTheme();
  const insets = useSafeAreaInsets();
  const save = useSaveFitnessTest();
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<(Answer | null)[]>(() => Array.from({ length: READINESS_QUESTIONS }, () => null));
  const [pushups, setPushups] = useState(0);
  const [knee, setKnee] = useState(false);
  const [plankS, setPlankS] = useState(0);
  const timer = useStopwatch(FITNESS.maxPlankS);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  // Směr posledního přechodu (1 vpřed, −1 zpět): nový krok přijede z té strany. Stav se mění hned, pohyb ho jen znázorní.
  const [dir, setDir] = useState<1 | -1>(1);

  const ready = readiness(answers.map((a) => a === 'yes'));
  const plankShown = timer.running ? timer.elapsed : plankS;

  const stopTimer = () => { if (timer.running) { setPlankS(timer.stop()); feedback('timerStop'); } };
  const startTimer = () => { timer.start(); feedback('timerStart'); };

  const onSave = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setFailed(false);
    const ok = await save({ pushups, plankS, kneePushups: knee, readiness: ready });
    inFlight.current = false;
    setBusy(false);
    if (ok) { feedback('setupDone'); close(); } else { feedback('formError'); setFailed(true); }
  };

  const next = () => {
    if (step === 2) stopTimer();
    if (step < 3) { setDir(1); setStep((step + 1) as Step); } else void onSave();
  };
  const back = () => { if (step === 2) stopTimer(); if (step > 0) { setDir(-1); setStep((step - 1) as Step); } };

  const scale = scaleFromTest({ pushups, plankS, kneePushups: knee, testedAt: '' });

  return (
    <ReactiveBackground>
      <ScreenHeader
        intro
        title={t.headerTitle}
        status={{ left: t.kicker, right: t.stepValue(step + 1, STEPS), rightA11y: copy.onboarding.stepA11y(step + 1, STEPS) }}
        actions={[{ icon: X, label: t.skip, onPress: close }]}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <IntentScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: insets.bottom + space.xl, gap: space.l }}
          showsVerticalScrollIndicator={false}
        >
          <DotSteps total={STEPS} current={step} />

          {/* Klíč = krok: každý krok se namountuje znovu a přijede po směru navigace (Reduce Motion = calmFade). */}
          <StepEnter key={step} dir={dir}>

          {step === 0 ? (
            <StepBody title={t.readinessTitle} lead={t.readinessIntro}>
              <Tile pad="none">
                {t.readiness.map((q, i) => (
                  <View key={q} style={{ paddingHorizontal: size.tilePad, paddingVertical: space.m, gap: space.m, borderBottomWidth: i === t.readiness.length - 1 ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
                    <View style={{ flexDirection: 'row', gap: space.m }}>
                      <Text variant="label" tone="muted" style={{ paddingTop: space.xs }}>{String(i + 1).padStart(2, '0')}</Text>
                      <Text variant="body" style={{ flex: 1 }}>{q}</Text>
                    </View>
                    <SegmentedControl
                      label={t.questionA11y(i + 1, q)}
                      options={YES_NO}
                      value={answers[i] ?? null}
                      onChange={(v) => setAnswers((a) => a.map((x, k) => (k === i ? v : x)))}
                    />
                  </View>
                ))}
              </Tile>
              {/* „Ano“ nic neblokuje: jen jasná věta v rámečku `text` (bez akcentu), čtečka ji ohlásí. */}
              {ready === 'consult' ? (
                <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: c.text, borderRadius: radius.tile, padding: size.tilePad }}>
                  <Text variant="bodyStrong">{t.consult}</Text>
                </View>
              ) : null}
            </StepBody>
          ) : null}

          {step === 1 ? (
            <StepBody title={t.pushupsTitle} lead={t.pushupsHow}>
              <Tile style={{ gap: space.l }}>
                <NumberStepper
                  value={pushups} onChange={setPushups} max={FITNESS.maxPushups}
                  unit={t.reps} label={t.pushupsField} minusLabel={t.minus(t.reps)} plusLabel={t.plus(t.reps)}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingTop: space.m }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>{t.kneeToggle}</Text>
                  <Toggle value={knee} label={t.kneeToggle} onChange={setKnee} />
                </View>
              </Tile>
            </StepBody>
          ) : null}

          {step === 2 ? (
            <StepBody title={t.plankTitle} lead={t.plankHow}>
              <Tile style={{ gap: space.l }}>
                {/* Prstenec stopek: kolo za minutu, plní se z času ze značek (číslo i prstenec ukazují totéž). */}
                <View style={{ alignItems: 'center' }}>
                  <DotRing progress={plankRingProgress(plankShown)} size={size.holdRingShort} intro={false} />
                </View>
                <NumberStepper
                  value={plankShown} onChange={setPlankS} max={FITNESS.maxPlankS} step={PLANK_STEP} readOnly={timer.running}
                  unit={t.seconds} label={t.plankField} minusLabel={t.minus(t.seconds)} plusLabel={t.plus(t.seconds)}
                />
                <View style={{ gap: space.s }}>
                  <PillButton
                    label={timer.running ? t.stopTimer : t.startTimer}
                    variant={timer.running ? 'primary' : 'secondary'}
                    onPress={() => (timer.running ? stopTimer() : startTimer())}
                    accessibilityHint={t.timerA11y(plankShown, timer.running)}
                  />
                  <Text variant="caption" tone="muted">{t.timerHint}</Text>
                </View>
              </Tile>
            </StepBody>
          ) : null}

          {step === 3 ? (
            <StepBody title={t.resultTitle}>
              <Tile style={{ gap: space.l }}>
                <Text variant="headline" accessibilityRole="summary">{t.resultLine(scale.reps, scale.hold)}</Text>
                <View style={{ flexDirection: 'row', gap: space.l, flexWrap: 'wrap' }}>
                  <ResultStats pushups={pushups} plankS={plankS} pushupsLabel={knee ? t.kneeToggle : t.pushupsTitle} />
                </View>
              </Tile>
              <Text variant="body" tone="muted">{t.intro}</Text>
              {failed ? <Text variant="bodyStrong" accessibilityRole="alert" style={{ color: c.danger }}>{t.saveError}</Text> : null}
            </StepBody>
          ) : null}
          </StepEnter>

          <Text variant="caption" tone="muted">{t.disclaimer}</Text>
        </IntentScrollView>
        <BigActionBar
          primary={{ label: step === 3 ? t.save : t.next, onPress: next, disabled: busy }}
          secondary={step === 0 ? { label: t.skipShort, onPress: close } : { label: t.back, onPress: back }}
        />
      </KeyboardAvoidingView>
    </ReactiveBackground>
  );
}

/** Nadpis kroku (Inter `title`) a návod (`body muted`) nad obsahem. */
function StepBody({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.l }}>
      <View style={{ gap: space.s }}>
        <Text variant="title" accessibilityRole="header">{title}</Text>
        {lead ? <Text variant="body" tone="muted">{lead}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Nástup kroku: po mountu (klíč = krok) fade a posun `dir · stepShift` → 0 na UI vlákně. Worklet čte jen sdílenou
 *  hodnotu a čísla. Omezený pohyb: shift 0, jen `calmFade`. Obsah je interaktivní hned, pohyb nic neblokuje. */
function StepEnter({ dir, children }: { dir: 1 | -1; children: ReactNode }) {
  const { reduced } = useMotionSafe();
  const p = useSharedValue(0);
  const shift = reduced ? 0 : dir * fitnessTest.stepShift;
  useEffect(() => {
    p.value = withTiming(1, stepEnterTiming(reduced));
    // Nástup jednou při mountu kroku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: (1 - p.value) * shift }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Výsledek: čísla krátce napočítají (kliky, plank o `countGapMs` později); čtečka dostane rovnou konečné hodnoty. */
function ResultStats({ pushups, plankS, pushupsLabel }: { pushups: number; plankS: number; pushupsLabel: string }) {
  const p = useCountUp(pushups, fitnessTest.countMs);
  const h = useCountUp(plankS, fitnessTest.countMs, 0, { delayMs: fitnessTest.countGapMs });
  return (
    <>
      <Stat value={p} a11yValue={pushups} unit={t.reps} label={pushupsLabel} />
      <Stat value={h} a11yValue={plankS} unit={t.seconds} label={t.plankTitle} />
    </>
  );
}
