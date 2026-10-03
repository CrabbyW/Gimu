import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Mascot } from '@/components/mascot';
import { ActivityGrid } from '@/components/progress/ActivityGrid';
import { DreamBodyCard } from '@/components/progress/DreamBodyCard';
import { MilestoneRow } from '@/components/progress/MilestoneRow';
import { MilestoneSheet } from '@/components/progress/MilestoneSheet';
import { NumberSheet } from '@/components/progress/NumberSheet';
import { WeightChart } from '@/components/progress/WeightChart';
import { Button } from '@/components/ui/Button';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stat } from '@/components/ui/Stat';
import { TabHeader } from '@/components/ui/TabHeader';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { progressActions, useProgressView } from '@/hooks/useProgressView';
import { haptics } from '@/lib/haptics';
import { intro, motion, stagger, useMotionSafe } from '@/lib/motion';
import { parseWeight } from '@/logic/onboarding';
import { useTheme } from '@/theme';
import type { MascotStage, Milestone, UserProfile } from '@/types';

/** Jak dlouho drží overlay celebrate bez nové kosmetiky (Task 27 Step 7). S kosmetikou čeká na zavření. */
const CELEBRATE_MS = 1800;
/** Opice v overlay oslavy milníku nastoupí z této velikosti pružinou `motion.settle`. */
const MASCOT_FROM = 0.6;

const fmtKg = (kg: number) => (Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace('.', ','));

export default function ProgressScreen() {
  const { c } = useTheme();
  const profile = useProfile();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.progress} />
      {profile.status === 'loading' || (profile.status === 'ready' && !profile.data) ? <DotLoaderScreen />
        : profile.status === 'error' ? <ErrorState edges={[]} what={copy.progress.errorWhat} onRetry={profile.retry} />
          : <ProgressBody profile={profile.data!} />}
    </View>
  );
}

type Celebration = { unlocked: boolean };

function ProgressBody({ profile }: { profile: UserProfile }) {
  const { c, space } = useTheme();
  const view = useProgressView(profile);
  const stats = useProfileStats(profile);
  const stage = useDisplayStage(stats?.stage ?? 1);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  // Motion: úvodní sled jen při prvním zobrazení tabu. Sekce nastoupí po 70 ms, mřížka se vyplní po dnech,
  // lišty milníků se natáhnou, graf se vykreslí čarou.
  const first = useFirstShow('tab:progress');
  const T = intro.tab;

  if (!view) return null;
  const { grid, chart, milestones, dreamBody } = view;
  // Dnešek má v mřížce vlastní stav `today`; když je dnes odcvičeno (`todayDone` z useProfileStats), počítá se.
  const todayDone = stats?.todayDone ?? false;
  const activeCount = grid.filter((g) => g.state === 'active').length + (todayDone ? 1 : 0);
  const latest = chart && chart.points.length > 0 ? chart.points[chart.points.length - 1]!.kg : null;

  const saveMilestone = async (current: number) => {
    if (!editing) return;
    const r = await progressActions.updateMilestone(editing.id, current);
    setEditing(null);
    if (r.completed) {
      haptics.success();
      setCelebration({ unlocked: r.unlockedCosmeticIds.length > 0 });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space.l, paddingBottom: space.xxl, gap: space.xl }} keyboardShouldPersistTaps="handled">
        {dreamBody ? <Reveal play={first} rise={T.rise}><DreamBodyCard text={dreamBody} /></Reveal> : null}

        <Section label={copy.progress.activityLabel} play={first} delay={T.step}>
          <ActivityGrid cells={grid} todayDone={todayDone} play={first} />
          {/* Prázdný stav nese věta v mřížce; „0 dní“ by jen opakovalo prázdno. */}
          {activeCount > 0 ? <Telemetry items={[{ key: copy.progress.activeKey, value: copy.progress.activeDays(activeCount) }]} /> : null}
        </Section>

        <Section label={copy.progress.milestonesLabel} play={first} delay={T.step * 2}>
          {milestones.length === 0 ? <Text variant="body" tone="muted">{copy.progress.noMilestones}</Text> : (
            <View>
              {milestones.map((m, i) => (
                <View key={m.id} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule } : undefined}>
                  <MilestoneRow milestone={m} onPress={() => setEditing(m)} play={first} delay={intro.bars.at + stagger(i, intro.bars.step)} />
                </View>
              ))}
            </View>
          )}
        </Section>

        {chart ? (
          <Section label={copy.progress.weightLabel} play={first} delay={T.step * 3}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.l }}>
              {latest !== null ? <Stat value={fmtKg(latest)} unit={copy.progress.weightUnit} size="M" /> : null}
              <Telemetry items={[{ key: copy.progress.weightTarget, value: fmtKg(chart.targetKg), unit: copy.progress.weightUnit }]} style={{ paddingBottom: space.s }} />
            </View>
            <WeightChart model={chart} play={first} />
            <Button label={copy.progress.logWeight} variant="secondary" onPress={() => setWeightOpen(true)} />
          </Section>
        ) : null}
      </ScrollView>

      <MilestoneSheet milestone={editing} onSave={saveMilestone} onClose={() => setEditing(null)} />
      <NumberSheet
        visible={weightOpen}
        title={copy.progress.logWeight}
        fieldLabel={copy.progress.weightField}
        unit={copy.progress.weightUnit}
        initial={latest !== null ? fmtKg(latest) : ''}
        validate={(raw) => {
          const kg = parseWeight(raw);
          return kg === null || kg < 30 || kg > 250 ? copy.progress.weightError : null;
        }}
        onSubmit={async (raw) => { await progressActions.logWeight(parseWeight(raw)!); setWeightOpen(false); }}
        onClose={() => setWeightOpen(false)}
      />
      {celebration ? (
        <CelebrateOverlay stage={stage} equipped={profile.equipped} unlocked={celebration.unlocked} onDone={() => setCelebration(null)} />
      ) : null}
    </View>
  );
}

function Section({ label, children, play = false, delay = 0 }: { label: string; children: ReactNode; play?: boolean; delay?: number }) {
  const { space } = useTheme();
  return (
    <Reveal play={play} delay={delay} rise={intro.tab.rise} style={{ gap: space.m }}>
      <Text variant="label" tone="muted" accessibilityRole="header">{label}</Text>
      {children}
    </Reveal>
  );
}

/** Splněný milník: opice celebrate přes obrazovku. Bez nové kosmetiky zmizí po 1.8 s sama; s kosmetikou
 *  zůstane, dokud uživatel nezvolí Šatník nebo Zavřít (odkaz by jinak utekl dřív, než ho přečte). */
function CelebrateOverlay({ stage, equipped, unlocked, onDone }: {
  stage: MascotStage; equipped: UserProfile['equipped']; unlocked: boolean; onDone(): void;
}) {
  const { c, space } = useTheme();
  const { reduced } = useMotionSafe();
  // Nástup: scrim se prolne (UI timing), opice dosedne pružinou ze 0.6 (fyzický prvek, odměna) a pak
  // hraje vlastní celebrate poskoky. Omezený pohyb: opice stojí, jen prolnutí.
  const [calm] = useState(reduced);
  const pop = useSharedValue(calm ? 1 : MASCOT_FROM);
  useEffect(() => { if (!calm) pop.set(withSpring(1, motion.settle)); }, [calm, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  useEffect(() => {
    if (unlocked) return;
    const id = setTimeout(() => done.current(), CELEBRATE_MS);
    return () => clearTimeout(id);
  }, [unlocked]);

  return (
    <Animated.View
      entering={FadeIn.duration(motion.calmFade.duration).reduceMotion(ReduceMotion.Never)}
      exiting={FadeOut.duration(motion.uiExit.duration).reduceMotion(ReduceMotion.Never)}
      style={StyleSheet.absoluteFill}
    >
    <Pressable
      onPress={onDone}
      accessibilityRole="button"
      accessibilityLabel={copy.progress.dismiss}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim, alignItems: 'center', justifyContent: 'center', gap: space.l, padding: space.l }}
    >
      <Animated.View style={popStyle}>
        <Mascot stage={stage} mood="celebrate" size="M" cosmetics={equipped} accessibilityLabel={copy.mascot.label.celebrate} />
      </Animated.View>
      <Text variant="title" accessibilityLiveRegion="polite">{copy.progress.milestoneDone}</Text>
      {unlocked ? (
        <View style={{ alignItems: 'center', gap: space.m }}>
          <Text variant="label">{copy.progress.newCosmetic}</Text>
          <Button label={copy.progress.toWardrobe} onPress={() => { onDone(); router.push('/wardrobe'); }} />
        </View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}
