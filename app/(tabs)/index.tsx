import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotField, DotPlate, DotRing } from '@/components/dots';
import { LessonMap } from '@/components/map/LessonMap';
import { currentSection, SectionHero } from '@/components/map/SectionHero';
import { Card } from '@/components/ui/Card';
import { useFirstShow } from '@/components/ui/choreo';
import { ErrorState } from '@/components/ui/ErrorState';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useLeague } from '@/hooks/useLeague';
import { useLessonMinutes } from '@/hooks/useLessonMinutes';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import type { LessonPathView, MapNode } from '@/services/contracts';
import { dots, useTheme } from '@/theme';

/** Výška pole za hlavičkou: tolik řádků, kolik dovolí strop teček při dané šířce. */
const fieldHeight = (width: number) => {
  const cols = Math.floor(width / dots.field.pitch) + 1;
  return Math.floor(dots.field.max / cols) * dots.field.pitch;
};

const findNode =(view: LessonPathView, id: string | null): MapNode | undefined =>
  (id === null ? undefined : view.sections.flatMap((s) => s.nodes).find((n) => n.lesson.id === id));

/**
 * Trénink (Nothing Dot §6): stavový řádek „SEKCE 01 · ● 12 DNÍ“, Doto titulek sekce, hero dlaždice pokroku
 * s řádkem teček, pod ní mapa tečkových kotoučů s opičkou na aktuálním a plovoucí pilulka `[ZAČÍT LEKCI]`.
 * Hierarchie: nejsilnější plocha obrazovky je jediná plná pilulka; nejsilnější číslo je pokrok v hero.
 * Za hlavičkou leží tečkové pole, které směrem dolů dozní (mapa pod ním stojí na čistém `base`).
 */
export default function TrainingScreen() {
  const { c, space, size } = useTheme();
  const { width } = useWindowDimensions();
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const view = useLessonPath(data?.path);
  const viewData = view.status === 'ready' ? view.data : null;
  const minutesOf = useLessonMinutes(viewData);
  const stats = useProfileStats(data);
  // Liga při načtení vyhodnotí uplynulý týden (postup/sestup), i když mapa úroveň už neukazuje.
  useLeague();
  // Po sekvenci se parametr smaže, aby se při návratu na tab nepřehrála znovu.
  const clearUnlocked = useCallback(() => router.setParams({ unlocked: undefined }), []);

  if (profile.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.path} onRetry={view.retry} />;
  if (!viewData || !stats || !data) return <MapSkeleton />;

  const section = currentSection(viewData);
  const first = stats.isNew ? findNode(viewData, viewData.currentLessonId) : undefined;
  const sad = !stats.isNew && stats.mood === 'sad';
  const currentId = viewData.currentLessonId;
  const open = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });
  return (
    <MapContent
      unlocked={unlocked ?? null}
      render={(intro) => (
        <View style={{ flex: 1, backgroundColor: c.base }}>
          {/* Pole za hlavičkou: strop `dots.field.max` utne řádky dole, pásma ho nechají doznít do čistého `base`. */}
          <DotField width={width} height={fieldHeight(width)} fade="down" style={{ position: 'absolute', left: 0, top: 0 }} />
          <ScreenHeader
            title={section?.title ?? copy.tabs.training}
            status={{
              left: section ? copy.map.sectionKicker(section.index) : copy.tabs.training.toUpperCase(),
              right: copy.status.streak(stats.streak),
              // Tečka bliká, dokud dnes nic nebylo: živý údaj = „série čeká na dnešek“.
              live: !stats.todayDone,
              rightA11y: copy.status.streakA11y(stats.streak, stats.todayDone),
            }}
          />
          <SectionHero view={viewData} intro={intro} />
          {first ? (
            // Nový uživatel: náhled odměny za první lekci. Akci nese pilulka dole.
            <Card style={{ marginHorizontal: space.l, marginTop: space.s, flexDirection: 'row', alignItems: 'center', gap: space.m }}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="headline">{copy.map.firstTitle(minutesOf[first.lesson.id] ?? 1)}</Text>
                <Text tone="muted">{copy.map.firstBody(first.xp)}</Text>
              </View>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <DotPlate kg={first.lesson.plateKg} size={size.previewPlate} state="current" decorative showKg={false} />
              </View>
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
            onOpenLesson={open}
            onUnlockSequenceEnd={clearUnlocked}
            intro={intro}
            footerSpace={currentId ? size.pill + space.l : 0}
          />
          {currentId ? (
            <View pointerEvents="box-none" style={{ position: 'absolute', left: space.l, right: space.l, bottom: space.m }}>
              <PillButton label={copy.map.startLesson} onPress={() => open(currentId)} />
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

/** Načítání mapy: kostra tří uzlů jako prázdné tečkové prstence (tvar obsahu, ne spinner). */
function MapSkeleton() {
  const { c, space, size } = useTheme();
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
        <View key={i} style={{ marginLeft: dx }} importantForAccessibility="no-hide-descendants">
          <DotRing progress={0} size={size.node} />
        </View>
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
