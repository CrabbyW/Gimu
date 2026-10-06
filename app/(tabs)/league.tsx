import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { LeagueResultBanner } from '@/components/league/LeagueResultBanner';
import { LeagueRow } from '@/components/league/LeagueRow';
import { Podium } from '@/components/league/Podium';
import { TierBadge } from '@/components/league/TierBadge';
import { ZoneDivider } from '@/components/league/ZoneDivider';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { LockedPreview } from '@/components/ui/LockedPreview';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useLeague } from '@/hooks/useLeague';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { tierName } from '@/hooks/useTierName';
import { formatCountdown, isLeagueLocked } from '@/logic/league';
import { intro, motion, stagger } from '@/lib/motion';
import { services, type LeagueWeekView } from '@/services';
import { useCompact, useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

type Item = { kind: 'row'; entry: LeagueEntry; rank: number; last: boolean } | { kind: 'divider'; zone: 'promote' | 'demote' };

/** Řádky tabulky s oddělovači zón: za `promoteCount - 1` a před `length - demoteCount` (jen když > 0).
 *  Řádek těsně před zónou nebo na konci nemá spodní linku (oddělení nese zóna). */
function buildItems(v: LeagueWeekView): Item[] {
  const out: Item[] = [];
  const n = v.entries.length;
  v.entries.forEach((entry, i) => {
    if (v.demoteCount > 0 && i === n - v.demoteCount) out.push({ kind: 'divider', zone: 'demote' });
    const beforeDemote = v.demoteCount > 0 && i === n - v.demoteCount - 1;
    const endPromote = v.promoteCount > 0 && i === v.promoteCount - 1;
    out.push({ kind: 'row', entry, rank: i + 1, last: i === n - 1 || beforeDemote || endPromote });
    if (endPromote) out.push({ kind: 'divider', zone: 'promote' });
  });
  return out;
}

/** Na mapu (aktuální lekce sedí na mapě s primární pilulkou „Začít lekci“). */
const toMap = () => router.navigate('/(tabs)');

/**
 * Liga (Nothing Dot fáze 2). Hlavička: Doto „Liga“, stavový řádek s úrovní vlevo a živým odpočtem konce týdne
 * vpravo. Hierarchie: nejsilnější číslo obrazovky = tvoje pozice (Doto `hero` v hero dlaždici), pak pódium,
 * pak tabulka. Plátna: odznak 1 + pódium ≤ 3 = 4 (rozpočet ≤ 12); řádky jsou bez pláten.
 */
export default function LeagueScreen() {
  const { c } = useTheme();
  const league = useLeague();
  const profile = useProfile();
  const now = useNow(30_000);
  // Zamčeno jen bez jediné lekce v historii (`logic/league`), ne při 0 XP tento týden.
  const locked = profile.status === 'ready' && profile.data ? isLeagueLocked(profile.data.activity) : false;
  const loading = league.status === 'loading' || profile.status === 'loading';
  const view = league.status === 'ready' ? league.data : null;
  const left = view ? formatCountdown(view.endsAt.getTime() - now.getTime()) : null;
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <ScreenHeader
        title={copy.tabs.league}
        status={view && left ? {
          left: copy.league.statusTier(tierName(view.tier)),
          right: copy.league.statusEnds(left.d, left.h),
          live: true,
          rightA11y: copy.league.countdownA11y(left.d, left.h, left.m),
        } : undefined}
      />
      {loading ? <DotLoaderScreen />
        : league.status === 'error' ? <ErrorState edges={[]} what={copy.league.errorWhat} onRetry={league.retry} />
          : locked ? <LockedLeague view={league.data} />
            : <Standings view={league.data} />}
    </View>
  );
}

/** Zamčená liga: odznak úrovně zhasnutý (náhled), pod ním zamčený náhled tabulky s pilulkou na mapu. */
function LockedLeague({ view }: { view: LeagueWeekView }) {
  const { space } = useTheme();
  const name = tierName(view.tier);
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }}>
      <Tile style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        <TierBadge tierId={view.tier} tierName={name} dim />
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <Text variant="label" tone="muted">{copy.league.tierKicker}</Text>
          <Text variant="headline">{copy.league.headerTitle(name)}</Text>
        </View>
      </Tile>
      <LockedPreview
        title={copy.league.lockedTitle}
        body={copy.league.lockedBody(view.entries.length)}
        cta={{ label: copy.league.lockedCta, onPress: toMap }}
      />
    </ScrollView>
  );
}

function Standings({ view }: { view: LeagueWeekView }) {
  const { space, size } = useTheme();
  const compact = useCompact();
  const list = useRef<FlatList<Item>>(null);
  const items = useMemo(() => buildItems(view), [view]);
  const myIndex = items.findIndex((it) => it.kind === 'row' && it.entry.isMe);
  const myXp = view.entries[view.myRank - 1]?.xpThisWeek ?? 0;
  const name = tierName(view.tier);
  const nobodyScored = view.entries.every((e) => e.xpThisWeek === 0);
  const inPromoteZone = view.promoteCount > 0 && view.myRank <= view.promoteCount;
  // Motion: úvodní sled jen při prvním zobrazení tabu.
  const first = useFirstShow('tab:league');
  // Pódium hraje nástup při prvním zobrazení tabu, nebo když se objeví až během relace (z prázdného stavu).
  const [podiumAtMount] = useState(!nobodyScored);
  const podiumPlay = first || !podiumAtMount;
  // Věta pod pozicí: prázdný týden (nikdo) / tvoje 0 XP / jinak XP tohoto týdne.
  const heroLine = nobodyScored ? copy.league.podiumEmpty : myXp === 0 ? copy.league.emptyWeek : copy.league.heroXp(copy.league.xpValue(myXp));

  // Po otevření tabu dojet tak, aby vlastní řádek byl uprostřed seznamu. S 0 XP se nescrolluje:
  // přednost má hero s výzvou, vlastní řádek je stejně poslední.
  useEffect(() => {
    if (myIndex < 0 || myXp === 0) return;
    const id = setTimeout(() => list.current?.scrollToIndex({ index: myIndex, viewPosition: 0.5, animated: true }), 350);
    return () => clearTimeout(id);
  }, [myIndex, myXp, view.weekStart]);

  const hero = (
    <View>
      {/* Výsledek minulého týdne nad hero (nejdůležitější novinka, dokud ji uživatel nezavře). */}
      {view.lastResult ? (
        <LeagueResultBanner
          result={view.lastResult}
          toTierName={tierName(view.lastResult.toTier)}
          onDismiss={() => { void services.league.dismissLastResult(); }}
        />
      ) : null}
      <Reveal play={first} delay={motion.screenIn.heroAt} rise={motion.screenIn.rise} style={{ paddingHorizontal: space.l, paddingBottom: space.m }}>
        {/* Hero (obr. 2): velké Doto číslo pozice + malá jednotka „/ 30“ vlevo nahoře, odznak úrovně vpravo,
            název ligy a věta týdne vlevo dole. */}
        <Tile style={{ minHeight: compact ? undefined : size.heroTile, justifyContent: 'space-between', gap: space.m }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.m }}>
            <View
              accessible
              accessibilityLabel={copy.league.heroA11y(view.myRank, view.entries.length)}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s, flexShrink: 1 }}
            >
              <Text variant={compact ? 'display' : 'hero'}>{view.myRank}</Text>
              <Text variant="headline" tone="muted">{copy.league.rankOf(view.entries.length)}</Text>
            </View>
            <TierBadge tierId={view.tier} tierName={name} intro={first ? motion.screenIn.heroAt : false} />
          </View>
          <View style={{ gap: space.xs }}>
            <Text variant="headline" numberOfLines={1}>{copy.league.headerTitle(name)}</Text>
            <Text variant="caption" tone="muted">{heroLine}</Text>
          </View>
        </Tile>
      </Reveal>
      <Podium entries={view.entries} play={podiumPlay} />
    </View>
  );

  return (
    <FlatList
      ref={list}
      data={items}
      initialNumToRender={items.length}
      keyExtractor={(it) => (it.kind === 'row' ? it.entry.userId : it.zone)}
      onScrollToIndexFailed={() => undefined}
      contentContainerStyle={{ paddingBottom: space.xxxl }}
      ListHeaderComponent={hero}
      renderItem={({ item, index }) => (item.kind === 'row'
        ? <LeagueRow entry={item.entry} rank={item.rank} index={index} play={first} last={item.last} />
        : <Reveal play={first} delay={intro.league.rows + stagger(index)} rise={0}><ZoneDivider kind={item.zone} /></Reveal>)}
      ListFooterComponent={
        <View style={{ paddingHorizontal: space.l, paddingTop: space.l, gap: space.m }}>
          {/* Výzva jen mimo postupovou zónu; v ní by slibovala něco, co už platí. */}
          {!inPromoteZone ? <PillButton label={copy.league.climbCta} accessibilityHint={copy.league.climb} variant="secondary" onPress={toMap} /> : null}
          <Text variant="caption" tone="muted">{copy.league.explainer}</Text>
        </View>
      }
    />
  );
}
