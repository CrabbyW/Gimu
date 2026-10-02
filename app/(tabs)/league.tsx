import { useEffect, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Countdown } from '@/components/league/Countdown';
import { LeagueResultBanner } from '@/components/league/LeagueResultBanner';
import { LeagueRow } from '@/components/league/LeagueRow';
import { TierBadge } from '@/components/league/TierBadge';
import { ZoneDivider } from '@/components/league/ZoneDivider';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stat } from '@/components/ui/Stat';
import { TabHeader } from '@/components/ui/TabHeader';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { useLeague } from '@/hooks/useLeague';
import { intro, motion, stagger } from '@/lib/motion';
import { tierName } from '@/hooks/useTierName';
import { services, type LeagueWeekView } from '@/services';
import { useCompact, useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

type Item = { kind: 'row'; entry: LeagueEntry; rank: number } | { kind: 'divider'; zone: 'promote' | 'demote' };

/** Řádky tabulky s oddělovači zón: za `promoteCount - 1` a před `length - demoteCount` (jen když > 0). */
function buildItems(v: LeagueWeekView): Item[] {
  const out: Item[] = [];
  v.entries.forEach((entry, i) => {
    if (v.demoteCount > 0 && i === v.entries.length - v.demoteCount) out.push({ kind: 'divider', zone: 'demote' });
    out.push({ kind: 'row', entry, rank: i + 1 });
    if (v.promoteCount > 0 && i === v.promoteCount - 1) out.push({ kind: 'divider', zone: 'promote' });
  });
  return out;
}

export default function LeagueScreen() {
  const { c } = useTheme();
  const league = useLeague();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.league} />
      {league.status === 'loading' ? <DotLoaderScreen />
        : league.status === 'error' ? <ErrorState edges={[]} what={copy.league.errorWhat} onRetry={league.retry} />
          : <Standings view={league.data} />}
    </View>
  );
}

function Standings({ view }: { view: LeagueWeekView }) {
  const { c, space } = useTheme();
  const compact = useCompact();
  const list = useRef<FlatList<Item>>(null);
  const items = useMemo(() => buildItems(view), [view]);
  const myIndex = items.findIndex((it) => it.kind === 'row' && it.entry.isMe);
  const myXp = view.entries[view.myRank - 1]?.xpThisWeek ?? 0;
  const name = tierName(view.tier);
  // Motion: úvodní sled jen při prvním zobrazení tabu: hlavička (XP napočítá), řádky po 45 ms,
  // vlastní řádek jako vyvrcholení po dojetí scrollu.
  const first = useFirstShow('tab:league');
  const xpShown = useCountUp(myXp, motion.countFirstMs + 200, 0, { enabled: first, delayMs: intro.league.header + 80 });

  // Po otevření tabu dojet tak, aby vlastní řádek byl uprostřed seznamu (hlavička je mimo scroll, zůstává). S 0 XP (začátek týdne) se nescrolluje:
  // přednost má hlavička s výzvou, vlastní řádek je stejně poslední.
  useEffect(() => {
    if (myIndex < 0 || myXp === 0) return;
    const id = setTimeout(() => list.current?.scrollToIndex({ index: myIndex, viewPosition: 0.5, animated: true }), 350);
    return () => clearTimeout(id);
  }, [myIndex, myXp, view.weekStart]);

  return (
    <View style={{ flex: 1 }}>
      {/* Výsledek minulého týdne nad seznamem (ne v něm), aby ho neodjel scroll na vlastní řádek. */}
      {view.lastResult ? (
        <LeagueResultBanner
          result={view.lastResult}
          toTierName={tierName(view.lastResult.toTier)}
          onDismiss={() => { void services.league.dismissLastResult(); }}
        />
      ) : null}
      {/* Hlavička mimo FlatList (sticky): odznak, pozice, XP a odpočet zůstanou vidět i po dojetí na vlastní řádek. */}
      <Reveal play={first} delay={intro.league.header} rise={intro.tab.rise} style={{ paddingHorizontal: space.l, paddingTop: space.xl, paddingBottom: space.l, gap: space.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
        {/* Na 320 pt by se XP s jednotkou nevešlo (QA bug 10): pozice o stupeň menší, menší mezery; delší XP (4+ cifry) zalomí na další řádek. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: compact ? space.m : space.l, rowGap: space.m }}>
          <TierBadge tierName={name} />
          <Stat label={copy.league.rank} value={view.myRank} unit={`/ ${view.entries.length}`} size={compact ? 'M' : 'L'} />
          <Stat label={copy.league.myXp} value={xpShown} a11yValue={myXp} unit={copy.league.xp} size="M" />
        </View>
        <Countdown endsAt={view.endsAt} />
        {myXp === 0 ? <Text variant="body" tone="muted">{copy.league.emptyWeek}</Text> : null}
      </Reveal>
      <FlatList
        ref={list}
        data={items}
        initialNumToRender={items.length}
        keyExtractor={(it) => (it.kind === 'row' ? it.entry.userId : it.zone)}
        onScrollToIndexFailed={() => undefined}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        renderItem={({ item, index }) => (item.kind === 'row'
          ? <LeagueRow entry={item.entry} rank={item.rank} index={index} play={first} />
          : <Reveal play={first} delay={intro.league.rows + stagger(index)} rise={0}><ZoneDivider kind={item.zone} /></Reveal>)}
        ListFooterComponent={
          <Text variant="caption" tone="muted" style={{ paddingHorizontal: space.l, paddingTop: space.l }}>{copy.league.explainer}</Text>
        }
      />
    </View>
  );
}
