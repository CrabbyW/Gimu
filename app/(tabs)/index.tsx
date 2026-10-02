import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { LessonMap } from '@/components/map/LessonMap';
import { useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { TopBar, type SectionProgress } from '@/components/ui/TopBar';
import { copy } from '@/data/copy';
import { useLeague } from '@/hooks/useLeague';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useTierName } from '@/hooks/useTierName';
import type { LessonPathView } from '@/services/contracts';
import { useTheme } from '@/theme';

/** Sekce s aktuální lekcí (po dokončení celé cesty poslední) a počet hotových uzlů v ní.
 *  Jen čtení stavů z `LessonPathView` pro měřicí linku v hlavičce, žádná herní logika. */
function currentSection(view: LessonPathView): SectionProgress | null {
  const s = view.sections.find((sec) => sec.nodes.some((n) => n.lesson.id === view.currentLessonId)) ?? view.sections.at(-1);
  if (!s) return null;
  return { index: s.index, title: s.title, done: s.nodes.filter((n) => n.state === 'done').length, total: s.nodes.length };
}

export default function TrainingScreen() {
  const { c } = useTheme();
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const view = useLessonPath(data?.path);
  const stats = useProfileStats(data);
  // Liga při načtení vyhodnotí uplynulý týden, takže TopBar ukáže úroveň po postupu/sestupu.
  const league = useLeague();
  const tierName = useTierName(league.status === 'ready' ? league.data.tier : data?.leagueTier);
  // Po sekvenci se parametr smaže, aby se při návratu na tab nepřehrála znovu.
  const clearUnlocked = useCallback(() => router.setParams({ unlocked: undefined }), []);

  if (profile.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.path} onRetry={view.retry} />;
  if (view.status !== 'ready' || !stats || !data) return <DotLoaderScreen />;
  return (
    <MapContent
      unlocked={unlocked ?? null}
      render={(intro) => (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TopBar
        intro={intro}
        streak={stats.streak} streakBroken={stats.streakBroken} xp={stats.totalXp} tierLabel={tierName}
        section={currentSection(view.data)}
      />
      <LessonMap
        view={view.data}
        stats={stats}
        cosmetics={data.equipped}
        unlockedLessonId={unlocked ?? null}
        onOpenLesson={(id) => router.push({ pathname: '/lesson/[id]', params: { id } })}
        onUnlockSequenceEnd={clearUnlocked}
        intro={intro}
      />
    </View>
      )}
    />
  );
}

/** Úvodní sled mapy (motion) jen při prvním zobrazení obsahu a ne přes odemykací sekvenci. Samostatná
 *  komponenta, aby se „první zobrazení“ rozhodlo až s daty (ne během načítání). */
function MapContent({ unlocked, render }: { unlocked: string | null; render(intro: boolean): ReactNode }) {
  const first = useFirstShow('tab:map');
  const [intro] = useState(first && !unlocked);
  return <>{render(intro)}</>;
}
