import { StyleSheet, View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { StreakBarbell } from './StreakBarbell';
import { Text } from './Text';

interface Props {
  streak: number;
  longest: number;
  todayDone: boolean;
}

/** Pilulka série (Teplá litina §2.7): radius full, `surface`, malá činka + číslo `stat`.
 *  Číslo v `accentText`, při nule `muted`. Informační prvek, ne tlačítko: výška 36 bez dotykové plochy. */
export function StreakPill({ streak, longest, todayDone }: Props) {
  const { c, space, radius, size } = useTheme();
  const a11y = streak <= 0 ? copy.streak.none : todayDone ? copy.streak.a11yDone(streak) : copy.streak.a11yPending(streak);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11y}
      style={{
        minHeight: size.streakPill, borderRadius: radius.full, backgroundColor: c.surface,
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.edge,
        paddingHorizontal: space.m, flexDirection: 'row', alignItems: 'center', gap: space.s, alignSelf: 'flex-start',
      }}
    >
      <StreakBarbell variant="sm" streak={streak} longest={longest} todayDone={todayDone} />
      <Text variant="stat" tone={streak > 0 ? 'accent' : 'muted'}>{streak}</Text>
    </View>
  );
}
