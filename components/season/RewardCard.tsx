import { View } from 'react-native';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { opacity, useTheme } from '@/theme';
import type { MascotStage, Season } from '@/types';
import { SeasonBadge } from './SeasonBadge';

interface Props {
  season: Season;
  stage: MascotStage;
  /** Zamčená odměna (cíl zatím nesplněn / bez cíle): opička i odznak tlumené, mono „ZAMČENO“. */
  locked?: boolean;
}

/**
 * Odměna sezóny jako dlaždice (Nothing Dot fáze 2): vlastní opička už v sezónní šále (náhled, ne obrázek
 * z katalogu) a odznak `SeasonBadge` (jediné zlato UI). Zamčená = náhled ve `opacity.locked` a mono štítek
 * „ZAMČENO“, odemčená = plná. Opička je jediný barevný subjekt dlaždice.
 */
export function RewardCard({ season, stage, locked = false }: Props) {
  const { space, size } = useTheme();
  const outfit = season.rewardCosmeticIds[0];
  return (
    <Tile style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
      <View style={{ opacity: locked ? opacity.locked : 1 }}>
        <Mascot stage={stage} mood="idle" size={size.tileMascot} cosmetics={outfit ? { outfit } : {}} accessibilityLabel={copy.season.rewardItem(season.name)} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: space.xs, alignItems: 'flex-start' }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{locked ? copy.season.rewardLocked : copy.season.rewardTitle}</Text>
        <Text variant="headline">{copy.season.rewardItem(season.name)}</Text>
        <Text variant="caption" tone="muted">{copy.season.rewardNever}</Text>
      </View>
      <View style={{ opacity: locked ? opacity.locked : 1 }}><SeasonBadge seasonName={season.name} /></View>
    </Tile>
  );
}
