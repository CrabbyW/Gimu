import { StyleSheet, View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

/** Hranice zóny: mono štítek v `muted`, barvu (success/danger) nese jen trojúhelník, pak vlasová linka. */
export function ZoneDivider({ kind }: { kind: 'promote' | 'demote' }) {
  const { c, space, size } = useTheme();
  const [glyph, ...word] = (kind === 'promote' ? copy.league.promote : copy.league.demote).split(' ');
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={word.join(' ')}
      style={{ height: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.l }}
    >
      <Text variant="label" style={{ color: kind === 'promote' ? c.success : c.danger }}>{glyph}</Text>
      <Text variant="label" tone="muted">{word.join(' ')}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.rule }} />
    </View>
  );
}
