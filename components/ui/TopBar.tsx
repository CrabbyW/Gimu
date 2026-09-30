import { Flame } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { inkOn, useTheme } from '@/theme';
import { Text } from './Text';

const BAR_H = 56;
const BADGE = 20;

interface Props { streak: number; streakBroken: boolean; xp: number; tierLabel: string }

/** Hlavička mapy (instrument vrstva): streak, XP a liga v řadě, oddělené svislými vlasovými linkami. */
export function TopBar({ streak, streakBroken, xp, tierLabel }: Props) {
  const { c, space, seasonal } = useTheme();
  const insets = useSafeAreaInsets();
  const streakTone = streakBroken ? 'muted' : 'text';
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase, paddingTop: insets.top, height: BAR_H + insets.top,
        paddingHorizontal: space.m, flexDirection: 'row', alignItems: 'center',
        // Mapa pod hlavičkou scrolluje; jediný oddělovač je vlasová linka.
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule,
      }}
    >
      <Cell first accessibilityLabel={copy.map.streakA11y(streak)}>
        <Flame size={20} color={streakBroken ? c.muted : c.accent} strokeWidth={1.5} />
        <Text variant="counter" tone={streakTone} maxFontSizeMultiplier={1}>{streak}</Text>
        <Text variant="label" tone="muted">{copy.map.streak}</Text>
      </Cell>
      <Cell accessibilityLabel={copy.map.xpA11y(xp)}>
        <Text variant="counter" maxFontSizeMultiplier={1}>{xp}</Text>
        <Text variant="label" tone="muted">{copy.map.xp}</Text>
      </Cell>
      <Cell accessibilityLabel={copy.map.leagueA11y(tierLabel)}>
        <TierBadge initial={tierLabel.charAt(0)} />
        <Text variant="label" tone="muted" numberOfLines={1}>{copy.map.league(tierLabel)}</Text>
      </Cell>
    </View>
  );
}

function Cell({ first = false, accessibilityLabel, children }: { first?: boolean; accessibilityLabel: string; children: ReactNode }) {
  const { c, space } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.s, height: 32,
        ...(first ? { paddingRight: space.m } : { paddingHorizontal: space.m, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.rule }),
      }}
    >
      {children}
    </View>
  );
}

/** Kruh 20 pt v barvě nejtěžšího kotouče s iniciálou úrovně. */
function TierBadge({ initial }: { initial: string }) {
  const { c, radius } = useTheme();
  return (
    <View style={{ width: BADGE, height: BADGE, borderRadius: radius.full, backgroundColor: c.plate25, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="badgeLabel" maxFontSizeMultiplier={1} style={{ color: inkOn(c.plate25, c) }}>
        {initial}
      </Text>
    </View>
  );
}
