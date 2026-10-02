import { View } from 'react-native';
import { Mascot } from '@/components/mascot';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import type { MascotStage, Season } from '@/types';
import { SeasonBadge } from './SeasonBadge';

interface Props { season: Season; stage: MascotStage }

/**
 * Odměna sezóny (§7.7): vlastní opice už v šále (náhled, ne obrázek z katalogu) a odznak.
 * Opice je jediný barevný objekt karty; „Už nikdy nevyjde“ je mono štítek, ne výkřik.
 */
export function RewardCard({ season, stage }: Props) {
  const { space } = useTheme();
  const outfit = season.rewardCosmeticIds[0];
  return (
    <Card style={{ padding: space.l, flexDirection: 'row', alignItems: 'center', gap: space.l }}>
      <Mascot stage={stage} mood="idle" size="M" cosmetics={outfit ? { outfit } : {}} accessibilityLabel={copy.season.rewardItem(season.name)} />
      <View style={{ flex: 1, gap: space.s, alignItems: 'flex-start' }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{copy.season.rewardTitle}</Text>
        <Text variant="bodyStrong">{copy.season.rewardItem(season.name)}</Text>
        <Text variant="telemetry" tone="muted">{copy.season.rewardNever}</Text>
        <View style={{ marginTop: space.s }}><SeasonBadge seasonName={season.name} /></View>
      </View>
    </Card>
  );
}
