import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ComebackCard } from '@/components/season/ComebackCard';
import { RewardCard } from '@/components/season/RewardCard';
import { SeasonDays } from '@/components/season/SeasonDays';
import { SeasonGoalCard } from '@/components/season/SeasonGoalCard';
import { SeasonHeader } from '@/components/season/SeasonHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DotLoader, DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { RegMark } from '@/components/ui/RegMark';
import { TabHeader } from '@/components/ui/TabHeader';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { seasonActions, useSeasonProgress, useSeasonStatus } from '@/hooks/useSeason';
import { enterSafe, useMotionSafe } from '@/lib/motion';
import { diffDays, toISODate } from '@/logic/dates';
import type { SeasonStatus } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { SeasonGoal } from '@/types';

export default function SeasonScreen() {
  const { c } = useTheme();
  const status = useSeasonStatus();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.season} />
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
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.l, gap: space.m }}>
      <Text variant="title" accessibilityRole="header">{copy.season.none}</Text>
      <Text variant="body" tone="muted">{copy.season.noneBody}</Text>
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
  // „Lock in“ potvrzení: karta cíle vjede jen v okamžiku, kdy cíl právě vznikl (ne při každém otevření tabu).
  const [prevGoal, setPrevGoal] = useState(goal);
  const [justLocked, setJustLocked] = useState(false);
  if (goal !== prevGoal) {
    setPrevGoal(goal);
    if (!prevGoal && goal) setJustLocked(true);
  }

  const record = async (current: number) => {
    if (goal?.kind !== 'milestone') return;
    const next: SeasonGoal = { ...goal, current };
    await seasonActions.setGoal(season.id, next);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
      <SeasonHeader season={season} daysLeft={daysLeft} />
      <View style={{ paddingHorizontal: space.l, paddingTop: space.xl, gap: space.xl }}>
        {!active ? (
          <View style={{ gap: space.l, alignItems: 'flex-start' }}>
            <Text variant="body" tone="muted">{copy.season.endedBody}</Text>
            <Button label={copy.season.recapCta} onPress={() => router.push({ pathname: '/season-recap', params: { seasonId: season.id } })} />
            {claimed ? <Text variant="telemetry" tone="muted">{copy.season.claimedNote}</Text> : null}
          </View>
        ) : !goal ? (
          <>
            <RegMark>
              <Card style={{ padding: space.l, gap: space.m, alignItems: 'flex-start' }}>
                <Text variant="title" accessibilityRole="header">{copy.season.lockIn}</Text>
                <Text variant="body" tone="muted">{copy.season.lockInBody}</Text>
                <Button label={copy.season.lockInCta} onPress={() => router.push('/season-goal')} style={{ marginTop: space.s }} />
              </Card>
            </RegMark>
            <RewardCard season={season} stage={stage} />
          </>
        ) : progress.status === 'loading' ? (
          <View style={{ paddingVertical: space.xl }}><DotLoader /></View>
        ) : progress.status === 'error' ? (
          <View style={{ gap: space.m, alignItems: 'flex-start' }}>
            <Text variant="bodyStrong" accessibilityRole="alert">{copy.common.loadError(copy.season.errorWhat)}</Text>
            <Button label={copy.common.retry} variant="secondary" onPress={progress.retry} />
          </View>
        ) : (
          <>
            <Animated.View entering={justLocked ? enterSafe(reduced, 0, 16) : undefined}>
              <SeasonGoalCard progress={progress.data} onRecord={progress.data.goal.kind === 'milestone' ? record : undefined} />
            </Animated.View>
            <SeasonDays days={progress.data.dayStates} />
            {!progress.data.reachable || progress.data.repairWindow.length > 0 ? (
              <ComebackCard repairWindow={progress.data.repairWindow} reachable={progress.data.reachable} />
            ) : null}
            <RewardCard season={season} stage={stage} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
