import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { LessonMap } from '@/components/map/LessonMap';
import { ErrorState } from '@/components/ui/ErrorState';
import { TopBar } from '@/components/ui/TopBar';
import { copy } from '@/data/copy';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useTierName } from '@/hooks/useTierName';
import { useTheme } from '@/theme';

/** Detail lekce (`app/lesson/[id].tsx` vzniká v Task 12). */
// TODO(Task 12): po vzniku routy zrušit přetypování, typed routes ji zatím neznají.
const lessonHref = (id: string) => `/lesson/${encodeURIComponent(id)}` as Href;

export default function TrainingScreen() {
  const { c } = useTheme();
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const view = useLessonPath(data?.path);
  const stats = useProfileStats(data);
  const tierName = useTierName(data?.leagueTier);
  // Po sekvenci se parametr smaže, aby se při návratu na tab nepřehrála znovu.
  const clearUnlocked = useCallback(() => router.setParams({ unlocked: undefined }), []);

  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState what={copy.common.loadTarget.path} onRetry={view.retry} />;
  if (view.status !== 'ready' || !stats || !data) return <View style={{ flex: 1, backgroundColor: c.base }} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TopBar streak={stats.streak} streakBroken={stats.streakBroken} xp={stats.totalXp} tierLabel={tierName} />
      <LessonMap
        view={view.data}
        stats={stats}
        cosmetics={data.equipped}
        unlockedLessonId={unlocked ?? null}
        onOpenLesson={(id) => router.push(lessonHref(id))}
        onUnlockSequenceEnd={clearUnlocked}
      />
    </View>
  );
}
