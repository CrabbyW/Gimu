import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LessonMap } from '@/components/map/LessonMap';
import { Plate } from '@/components/map/Plate';
import { Card } from '@/components/ui/Card';
import { useFirstShow } from '@/components/ui/choreo';
import { ErrorState } from '@/components/ui/ErrorState';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { copy } from '@/data/copy';
import { useLeague } from '@/hooks/useLeague';
import { useLessonMinutes } from '@/hooks/useLessonMinutes';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useTierName } from '@/hooks/useTierName';
import type { LessonPathView, MapNode } from '@/services/contracts';
import { useTheme } from '@/theme';

const findNode = (view: LessonPathView, id: string | null): MapNode | undefined =>
  (id === null ? undefined : view.sections.flatMap((s) => s.nodes).find((n) => n.lesson.id === id));

export default function TrainingScreen() {
  const { c, space } = useTheme();
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const view = useLessonPath(data?.path);
  const viewData = view.status === 'ready' ? view.data : null;
  const minutesOf = useLessonMinutes(viewData);
  const stats = useProfileStats(data);
  // Liga při načtení vyhodnotí uplynulý týden, takže TopBar ukáže úroveň po postupu/sestupu.
  const league = useLeague();
  const tierName = useTierName(league.status === 'ready' ? league.data.tier : data?.leagueTier);
  // Po sekvenci se parametr smaže, aby se při návratu na tab nepřehrála znovu.
  const clearUnlocked = useCallback(() => router.setParams({ unlocked: undefined }), []);

  if (profile.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.path} onRetry={view.retry} />;
  if (!viewData || !stats || !data) return <MapSkeleton />;

  const first = stats.isNew ? findNode(viewData, viewData.currentLessonId) : undefined;
  const sad = !stats.isNew && stats.mood === 'sad';
  return (
    <MapContent
      unlocked={unlocked ?? null}
      render={(intro) => (
        <View style={{ flex: 1, backgroundColor: c.base }}>
          <TopBar
            intro={intro}
            streak={stats.streak} longestStreak={stats.longestStreak} todayDone={stats.todayDone}
            xp={stats.totalXp} tierLabel={tierName}
            showToday={!stats.isNew}
          />
          {first ? (
            // Nový uživatel: náhled odměny za první lekci místo řádku „Dnes čeká“. Bez CTA: akce je u uzlu.
            <Card style={{ marginHorizontal: space.l, marginTop: space.s, flexDirection: 'row', alignItems: 'center', gap: space.m }}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="headline">{copy.map.firstTitle(minutesOf[first.lesson.id] ?? 1)}</Text>
                <Text tone="muted">{copy.map.firstBody(first.xp)}</Text>
              </View>
              <PreviewPlate node={first} />
            </Card>
          ) : null}
          {sad ? (
            <Card style={{ marginHorizontal: space.l, marginTop: space.s, gap: space.xs }}>
              <Text variant="headline">{copy.map.brokenTitle}</Text>
              <Text tone="muted">{copy.map.brokenBody(stats.longestStreak)}</Text>
            </Card>
          ) : null}
          <LessonMap
            view={viewData}
            stats={stats}
            minutesOf={minutesOf}
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

/** Kotouč 48 v kartě první lekce: ten, který po lekci přibude na činku. Dekorativní. */
function PreviewPlate({ node }: { node: MapNode }) {
  const { size } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Plate kg={node.lesson.plateKg} size={size.previewPlate} state="current" />
    </View>
  );
}

/** Načítání mapy: kostra tří uzlů v `surface` (tvar obsahu, ne spinner). */
function MapSkeleton() {
  const { c, space, size, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const offsets = [0, size.node, 0];
  return (
    <View
      accessible
      accessibilityLabel={copy.common.loading}
      accessibilityState={{ busy: true }}
      style={{ flex: 1, backgroundColor: c.base, paddingTop: insets.top + space.xxl, alignItems: 'center', gap: space.xl }}
    >
      {offsets.map((dx, i) => (
        <View key={i} style={{ width: size.node, height: size.node, borderRadius: radius.full, backgroundColor: c.surface, marginLeft: dx }} />
      ))}
    </View>
  );
}

/** Úvodní sled mapy (motion) jen při prvním zobrazení obsahu a ne přes odemykací sekvenci. Samostatná
 *  komponenta, aby se „první zobrazení“ rozhodlo až s daty (ne během načítání). */
function MapContent({ unlocked, render }: { unlocked: string | null; render(intro: boolean): ReactNode }) {
  const first = useFirstShow('tab:map');
  const [intro] = useState(first && !unlocked);
  return <>{render(intro)}</>;
}
