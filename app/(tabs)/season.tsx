import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ComebackCard } from '@/components/season/ComebackCard';
import { shortDate } from '@/components/season/format';
import { RewardCard } from '@/components/season/RewardCard';
import { SeasonDays } from '@/components/season/SeasonDays';
import { SeasonGoalCard } from '@/components/season/SeasonGoalCard';
import { SeasonHeader } from '@/components/season/SeasonHeader';
import { Reveal, tileAt, useFirstShow } from '@/components/ui/choreo';
import { DotLoader, DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { FeatureLocked } from '@/components/ui/FeatureLocked';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { seasonActions, useSeasonProgress, useSeasonStatus } from '@/hooks/useSeason';
import { intro, motion } from '@/lib/motion';
import { diffDays, toISODate } from '@/logic/dates';
import type { SeasonStatus } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { SeasonGoal } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { IntentScrollView } from '@/components/dots';

const LOCK_RISE = intro.lockIn.rise;

/**
 * Sezóna (Nothing Dot fáze 2). Hlavička: Doto „Sezóna“, stavový řádek s názvem sezóny a termínem.
 * Hierarchie: odpočet (Doto `displayXL`) → cíl sezóny → dny → odměna. Plátna: prstenec 1 + pokrok cíle 1 = 2.
 */
export default function SeasonScreen() {
  // Hlavička = první úder nástupu obrazovky (jen první zobrazení v relaci).
  const headerIn = useFirstShow('hdr:season');
  const { c } = useTheme();
  const status = useSeasonStatus();
  // UX pass U4: nováček vidí sezónu až po 5 lekcích; do té doby klidná pozvánka (bez názvu a termínu sezóny).
  const gate = useDisclosure().gate('season');
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const gated = !gate.open && profile.status === 'ready' && profile.data !== null;
  const season = status.status === 'ready' && status.data && !gated ? status.data.season : null;
  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
      <ScreenHeader
        intro={headerIn}
        title={copy.tabs.season}
        status={season ? {
          left: season.name.toUpperCase(),
          right: copy.season.range(shortDate(season.startDate), shortDate(season.endDate)),
        } : undefined}
      />
      {gated && profile.data ? (
        <FeatureLocked
          what={copy.disclosure.what.season} left={gate.left} done={gate.done} need={gate.need}
          stage={stats?.stage ?? 1} cosmetics={profile.data.equipped} onCta={() => router.navigate('/(tabs)')}
        />
      ) : status.status === 'loading' ? <DotLoaderScreen edges={[]} />
        : status.status === 'error' ? <ErrorState edges={[]} what={copy.season.errorWhat} onRetry={status.retry} />
          : status.data === null ? <NoSeason />
            : <SeasonBody status={status.data} />}
    </ReactiveBackground>
  );
}

/** Prázdný stav: mezi sezónami. Pozvánka, ne omluva. */
function NoSeason() {
  const { space } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.l }}>
      <Tile style={{ gap: space.s }}>
        <Text variant="headline" accessibilityRole="header">{copy.season.none}</Text>
        <Text variant="body" tone="muted">{copy.season.noneBody}</Text>
      </Tile>
    </View>
  );
}

function SeasonBody({ status }: { status: SeasonStatus }) {
  const { space } = useTheme();
  const { season, phase, goal, claimed } = status;
  const now = useNow();
  const today = toISODate(now);
  const active = phase === 'active';
  // Ruling 11: dnešek se počítá (stejně jako `seasonProgress.daysLeft`); bez cíle progres nečteme, proto tady.
  const daysLeft = active ? Math.max(0, diffDays(season.endDate, today) + 1) : null;
  const progress = useSeasonProgress(active && goal ? season.id : undefined);
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const stage = useDisplayStage(stats?.stage ?? 1);
  // Motion: úvodní sled jen při prvním zobrazení tabu: hero, pak obsah o úder později.
  const first = useFirstShow('tab:season');
  // „Lock in“ potvrzení: karta cíle vjede jen v okamžiku, kdy cíl právě vznikl (ne při každém otevření tabu).
  const [prevGoal, setPrevGoal] = useState(goal);
  const [justLocked, setJustLocked] = useState(false);
  if (goal !== prevGoal) {
    setPrevGoal(goal);
    if (!prevGoal && goal) setJustLocked(true);
  }
  // Odměna je „zamčená“, dokud cíl není splněný (bez cíle i během načítání progresu).
  const rewardLocked = !(progress.status === 'ready' && progress.data.met);

  const record = async (current: number) => {
    if (goal?.kind !== 'milestone') return;
    const next: SeasonGoal = { ...goal, current };
    await seasonActions.setGoal(season.id, next);
  };

  return (
    <IntentScrollView contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }} showsVerticalScrollIndicator={false}>
      <Reveal play={first} delay={motion.screenIn.heroAt} rise={intro.tab.rise}>
        <SeasonHeader season={season} daysLeft={daysLeft} intro={first ? motion.screenIn.heroAt : false} />
      </Reveal>
      <Reveal play={first} delay={motion.screenIn.heroAt + intro.tab.step} rise={intro.tab.rise} style={{ gap: space.m }}>
        {!active ? (
          <Tile style={{ gap: space.m }}>
            <Text variant="body" tone="muted">{copy.season.endedBody}</Text>
            {claimed ? <Text variant="label" tone="muted">{copy.season.claimedNote}</Text> : null}
            <PillButton label={copy.season.recapCta} onPress={() => router.push({ pathname: '/season-recap', params: { seasonId: season.id } })} />
          </Tile>
        ) : !goal ? (
          <>
            <Tile style={{ gap: space.s }}>
              <Text variant="label" tone="muted">{copy.season.goalLabel}</Text>
              <Text variant="title" accessibilityRole="header">{copy.season.lockIn}</Text>
              <Text variant="body" tone="muted">{copy.season.lockInBody}</Text>
              <PillButton label={copy.season.lockInCta} onPress={() => router.push('/season-goal')} style={{ marginTop: space.s }} />
            </Tile>
            <RewardCard season={season} stage={stage} locked />
          </>
        ) : progress.status === 'loading' ? (
          <Tile style={{ alignItems: 'flex-start' }}><DotLoader /></Tile>
        ) : progress.status === 'error' ? (
          <Tile style={{ gap: space.m }}>
            <Text variant="bodyStrong" accessibilityRole="alert">{copy.common.loadError(copy.season.errorWhat)}</Text>
            <PillButton label={copy.common.retry} variant="secondary" onPress={progress.retry} />
          </Tile>
        ) : (
          <>
            {/* Lock in: karta cíle se zvedne z 16 pt jen v okamžiku, kdy cíl právě vznikl (Reveal, ne layout
                `entering`: ten na webu nechává obal `absolute`). Jinak dlaždice ve vlně po `screenIn.step`. */}
            <Reveal play={justLocked || first} delay={justLocked ? 0 : tileAt(0)} rise={justLocked ? LOCK_RISE : intro.tab.rise}>
              <SeasonGoalCard progress={progress.data} onRecord={progress.data.goal.kind === 'milestone' ? record : undefined} />
            </Reveal>
            <Reveal play={first} delay={tileAt(1)} rise={intro.tab.rise}>
              <SeasonDays days={progress.data.dayStates} />
            </Reveal>
            {!progress.data.reachable || progress.data.repairWindow.length > 0 ? (
              <Reveal play={first} delay={tileAt(2)} rise={intro.tab.rise}>
                <ComebackCard repairWindow={progress.data.repairWindow} reachable={progress.data.reachable} stage={stage} cosmetics={profile.status === 'ready' && profile.data ? profile.data.equipped : undefined} />
              </Reveal>
            ) : null}
            <Reveal play={first} delay={tileAt(3)} rise={intro.tab.rise}>
              <RewardCard season={season} stage={stage} locked={rewardLocked} />
            </Reveal>
          </>
        )}
      </Reveal>
    </IntentScrollView>
  );
}
