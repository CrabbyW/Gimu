import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ComebackCard } from '@/components/season/ComebackCard';
import { shortDate } from '@/components/season/format';
import { RewardCard } from '@/components/season/RewardCard';
import { SeasonDays } from '@/components/season/SeasonDays';
import { SeasonGoalCard } from '@/components/season/SeasonGoalCard';
import { SeasonHeader } from '@/components/season/SeasonHeader';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoader, DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { seasonActions, useSeasonProgress, useSeasonStatus } from '@/hooks/useSeason';
import { enterSafe, intro, motion, useMotionSafe } from '@/lib/motion';
import { diffDays, toISODate } from '@/logic/dates';
import type { SeasonStatus } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { SeasonGoal } from '@/types';

/**
 * Sezóna (Nothing Dot fáze 2). Hlavička: Doto „Sezóna“, stavový řádek s názvem sezóny a termínem.
 * Hierarchie: odpočet (Doto `displayXL`) → cíl sezóny → dny → odměna. Plátna: prstenec 1 + pokrok cíle 1 = 2.
 */
export default function SeasonScreen() {
  const { c } = useTheme();
  const status = useSeasonStatus();
  const season = status.status === 'ready' && status.data ? status.data.season : null;
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <ScreenHeader
        title={copy.tabs.season}
        status={season ? {
          left: season.name.toUpperCase(),
          right: copy.season.range(shortDate(season.startDate), shortDate(season.endDate)),
        } : undefined}
      />
      {status.status === 'loading' ? <DotLoaderScreen />
        : status.status === 'error' ? <ErrorState edges={[]} what={copy.season.errorWhat} onRetry={status.retry} />
          : status.data === null ? <NoSeason />
            : <SeasonBody status={status.data} />}
    </View>
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
  const { reduced } = useMotionSafe();
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
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }} showsVerticalScrollIndicator={false}>
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
            <Animated.View entering={justLocked ? enterSafe(reduced, 0, 16) : undefined}>
              <SeasonGoalCard progress={progress.data} onRecord={progress.data.goal.kind === 'milestone' ? record : undefined} />
            </Animated.View>
            <SeasonDays days={progress.data.dayStates} />
            {!progress.data.reachable || progress.data.repairWindow.length > 0 ? (
              <ComebackCard repairWindow={progress.data.repairWindow} reachable={progress.data.reachable} />
            ) : null}
            <RewardCard season={season} stage={stage} locked={rewardLocked} />
          </>
        )}
      </Reveal>
    </ScrollView>
  );
}
