import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { intro as T } from '@/lib/motion';
import { useTheme, tabularNums } from '@/theme';
import { Reveal } from './choreo';
import { StreakPill } from './StreakPill';
import { Text } from './Text';
import { TodayStatus } from './TodayStatus';

interface Props {
  streak: number;
  longestStreak: number;
  todayDone: boolean;
  xp: number;
  tierLabel: string;
  /** Řádek „Dnes hotovo / čeká“. Nový uživatel ho nemá (místo něj karta první lekce na mapě). */
  showToday?: boolean;
  /** Úvodní sled mapy (motion): položky naskočí po sobě, XP napočítá. */
  intro?: boolean;
}

/** Hlavička mapy (Teplá litina §3.1), vážená vlevo: pilulka série (nejdůležitější, jediný akcent hlavičky),
 *  vedle XP `caption muted`, vpravo úroveň ligy. Pod tím řádek TodayStatus. Bez plamene, telemetrie a měřicí linky. */
export function TopBar({ streak, longestStreak, todayDone, xp, tierLabel, showToday = true, intro = false }: Props) {
  const m = T.map;
  const xpShown = useCountUp(xp, m.countMs, 0, { enabled: intro, delayMs: m.telemetry });
  const { space, seasonal, size } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: seasonal.headerBase, paddingTop: insets.top + space.s, paddingHorizontal: space.l, paddingBottom: showToday ? 0 : space.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: size.hit }}>
        <Reveal play={intro} delay={m.streak} rise={8}>
          <StreakPill streak={streak} longest={longestStreak} todayDone={todayDone} />
        </Reveal>
        <Reveal play={intro} delay={m.telemetry} rise={8}>
          <Text variant="caption" tone="muted" accessibilityLabel={copy.map.xpA11y(xp)} style={tabularNums}>
            {copy.map.xpTotal(xpShown)}
          </Text>
        </Reveal>
        <View style={{ flex: 1 }} />
        <Reveal play={intro} delay={m.telemetry} rise={8}>
          <Text variant="caption" tone="muted" accessibilityLabel={copy.map.leagueA11y(tierLabel)} numberOfLines={1}>{tierLabel}</Text>
        </Reveal>
      </View>
      {showToday ? <TodayStatus status={todayDone ? 'done' : 'pending'} /> : null}
    </View>
  );
}
