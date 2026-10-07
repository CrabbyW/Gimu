import { router } from 'expo-router';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Mascot } from '@/components/mascot';
import { ActivityGrid } from '@/components/progress/ActivityGrid';
import { DreamBodyCard } from '@/components/progress/DreamBodyCard';
import { MilestoneRow } from '@/components/progress/MilestoneRow';
import { MilestoneSheet } from '@/components/progress/MilestoneSheet';
import { NumberSheet } from '@/components/progress/NumberSheet';
import { tileColumns } from '@/components/progress/layout';
import { WeightChart } from '@/components/progress/WeightChart';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { PillButton } from '@/components/ui/PillButton';
import { TabHeader } from '@/components/ui/TabHeader';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useCountUp } from '@/hooks/useCountUp';
import { progressActions, useProgressView } from '@/hooks/useProgressView';
import { haptics } from '@/lib/haptics';
import { intro, motion, stagger, useMotionSafe } from '@/lib/motion';
import { parseWeight } from '@/logic/onboarding';
import { useCompact, useTheme } from '@/theme';
import type { MascotStage, Milestone, UserProfile } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { IntentScrollView } from '@/components/dots';

/** Jak dlouho drží overlay celebrate bez nové kosmetiky (Task 27 Step 7). S kosmetikou čeká na zavření. */
const CELEBRATE_MS = 1800;
/** Opice v overlay oslavy milníku nastoupí z této velikosti pružinou `motion.settle`. */
const MASCOT_FROM = 0.6;

const fmtKg = (kg: number) => (Number.isInteger(kg) ? String(kg) : kg.toFixed(1));

export default function ProgressScreen() {
  // Hlavička = první úder nástupu obrazovky (jen první zobrazení v relaci).
  const headerIn = useFirstShow('hdr:progress');
  const { c } = useTheme();
  const profile = useProfile();
  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.progress} intro={headerIn} />
      {profile.status === 'loading' || (profile.status === 'ready' && !profile.data) ? <DotLoaderScreen edges={[]} />
        : profile.status === 'error' ? <ErrorState edges={[]} what={copy.progress.errorWhat} onRetry={profile.retry} />
          : <ProgressBody profile={profile.data!} />}
    </ReactiveBackground>
  );
}

type Celebration = { unlocked: boolean };

function ProgressBody({ profile }: { profile: UserProfile }) {
  const { space } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const cols = tileColumns(width, fontScale);
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
  const longest = stats?.longestStreak ?? 0;
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
      <IntentScrollView contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }} keyboardShouldPersistTaps="handled">
        {/* Hero (obr. 2): dvě dlaždice vedle sebe. Jediné Doto `hero` obrazovky = aktivní dny v okně mřížky;
            nejdelší série o stupeň tišeji (`display`). Nula se ukáže taky: prázdný hero by nechal obrazovku bez kotvy. */}
        <Reveal play={first} delay={motion.screenIn.heroAt} rise={T.rise}>
          <TileGrid cols={cols}>
            <HeroTile
              value={activeCount}
              unit={copy.streak.days(activeCount)}
              title={copy.progress.activeTitle}
              sub={copy.progress.activeSub}
              strong
              play={first}
              delay={motion.screenIn.heroAt}
              a11y={copy.progress.gridA11y(activeCount)}
            />
            <HeroTile
              value={longest}
              unit={copy.streak.days(longest)}
              title={copy.progress.longestTitle}
              sub={copy.progress.longestSub}
              play={first}
              delay={motion.screenIn.heroAt + motion.screenIn.step}
              a11y={`${copy.progress.heroLongestKey}: ${copy.progress.heroLongestValue(longest)}`}
            />
          </TileGrid>
        </Reveal>

        <Reveal play={first} delay={motion.screenIn.heroAt + T.step} rise={T.rise}>
          <ActivityGrid cells={grid} todayDone={todayDone} play={first} />
        </Reveal>

        <Reveal play={first} delay={motion.screenIn.heroAt + T.step * 2} rise={T.rise} style={{ gap: space.s }}>
          <Text variant="label" tone="muted" accessibilityRole="header" style={{ paddingTop: space.s }}>{copy.progress.milestonesLabel}</Text>
          {milestones.length === 0 ? (
            <Tile><Text tone="muted">{copy.progress.noMilestones}</Text></Tile>
          ) : (
            <TileGrid cols={cols}>
              {milestones.map((m, i) => (
                <MilestoneRow key={m.id} milestone={m} onPress={() => setEditing(m)} play={first} delay={intro.bars.at + stagger(i, intro.bars.step)} />
              ))}
            </TileGrid>
          )}
        </Reveal>

        {chart ? (
          <Reveal play={first} delay={motion.screenIn.heroAt + T.step * 3} rise={T.rise}>
            <Tile style={{ gap: space.m }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m }}>
                <Text variant="label" tone="muted" accessibilityRole="header">{copy.progress.weightLabel}</Text>
                <Text variant="label" tone="muted">{copy.progress.targetLine(chart.targetKg)}</Text>
              </View>
              {latest !== null ? (
                <View accessible accessibilityLabel={copy.progress.weightA11y(fmtKg(latest))} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s }}>
                  <Text variant="display">{fmtKg(latest)}</Text>
                  <Text variant="headline" tone="muted">{copy.progress.weightUnit}</Text>
                </View>
              ) : null}
              <WeightChart model={chart} play={first} />
              <PillButton label={copy.progress.logWeightCta} accessibilityHint={copy.progress.logWeight} variant="secondary" onPress={() => setWeightOpen(true)} />
            </Tile>
          </Reveal>
        ) : null}

        {dreamBody ? (
          <Reveal play={first} delay={motion.screenIn.heroAt + T.step * 4} rise={T.rise}><DreamBodyCard text={dreamBody} /></Reveal>
        ) : null}
      </IntentScrollView>

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

/** Mřížka dlaždic (obr. 2): po dvou vedle sebe, nebo pod sebou (`tileColumns`: úzký displej / velké písmo).
 *  Lichá poslední dlaždice ve dvou sloupcích drží poloviční šířku (prázdná buňka), ať se mřížka nerozjede. */
function TileGrid({ cols, children }: { cols: 1 | 2; children: ReactNode }) {
  const { space } = useTheme();
  const items = Children.toArray(children);
  if (cols === 1) return <View style={{ gap: space.m }}>{items}</View>;
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: space.m }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: space.m }}>
          {row.map((item, i) => <View key={i} style={{ flex: 1, minWidth: 0 }}>{item}</View>)}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

/** Hero dlaždice (obr. 2): velké Doto číslo + malá jednotka vlevo nahoře, název a podtitulek vlevo dole.
 *  `strong` = jediné `hero` číslo obrazovky; druhá dlaždice o stupeň tišeji (`display`). */
function HeroTile({ value, unit, title, sub, strong = false, a11y, play = false, delay = 0 }: {
  value: number; unit: string; title: string; sub: string; strong?: boolean; a11y: string; play?: boolean; delay?: number;
}) {
  const { space, size } = useTheme();
  // Motion: číslo se při prvním zobrazení napočítá (expo.out, `motion.countMs`); čtečka čte cílovou hodnotu (a11y).
  const shown = useCountUp(value, motion.countMs, 0, { enabled: play, delayMs: delay });
  const compact = useCompact();
  return (
    <Tile style={{ minHeight: size.heroTile, justifyContent: 'space-between', gap: space.m }}>
      <View accessible accessibilityLabel={a11y} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s, flexWrap: 'wrap' }}>
        <Text variant={strong && !compact ? 'hero' : 'display'} numberOfLines={1}>{shown}</Text>
        <Text variant="headline" tone="muted">{unit}</Text>
      </View>
      <View>
        <Text variant="headline" numberOfLines={2}>{title}</Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>{sub}</Text>
      </View>
    </Tile>
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
          <PillButton label={copy.progress.toWardrobe} onPress={() => { onDone(); router.push('/wardrobe'); }} />
        </View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}
