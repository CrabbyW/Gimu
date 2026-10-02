import { View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

interface Props { tierName: string; /** Skrýt mono štítek „LIGA“ (v banneru výsledku je kontext jasný). */ bare?: boolean }

/** Odznak úrovně ligy (§7.5): kruh 72 pt s obrysem `rule` 1.5, název úrovně v Bebas uvnitř, štítek LIGA nad ním. */
export function TierBadge({ tierName, bare = false }: Props) {
  const { c, space, size, radius } = useTheme();
  return (
    <View accessible accessibilityLabel={copy.map.leagueA11y(tierName)} style={{ alignItems: 'center', gap: space.s }}>
      {bare ? null : <Text variant="label" tone="muted">{copy.leagueTier}</Text>}
      <View
        style={{
          width: size.tierBadge, height: size.tierBadge, borderRadius: radius.full, borderWidth: 1.5, borderColor: c.rule,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text variant="tierName" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1}>{tierName.toUpperCase()}</Text>
      </View>
    </View>
  );
}
