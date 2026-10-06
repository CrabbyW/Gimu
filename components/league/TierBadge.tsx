import { View } from 'react-native';
import { DotRing } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { TIER_ORDER } from '@/logic/league';
import { useTheme } from '@/theme';
import type { LeagueTierId } from '@/types';

interface Props {
  tierId: LeagueTierId;
  tierName: string;
  /** Zamčená liga: prstenec zhasnutý, iniciála `muted`. Náhled, ne stav. */
  dim?: boolean;
  /** Nástup spirálou (motion); výchozí stojí. */
  intro?: boolean | number;
}

/**
 * Odznak úrovně ligy (Nothing Dot fáze 2): tečkový prstenec `DotRing` 72 s mono iniciálou úrovně uprostřed.
 * Prstenec není ozdoba: rozsvícený podíl = pořadí úrovně v žebříčku (Dřevo 1/7 … Diamant 7/7), takže
 * odznak zároveň ukazuje, kolik úrovní je ještě nad tebou. Jedno plátno na odznak (rozpočet pláten).
 */
export function TierBadge({ tierId, tierName, dim = false, intro = false }: Props) {
  const { size } = useTheme();
  const level = TIER_ORDER.indexOf(tierId as (typeof TIER_ORDER)[number]) + 1;
  const progress = dim ? 0 : Math.max(1, level) / TIER_ORDER.length;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={copy.league.tierA11y(tierName, Math.max(1, level), TIER_ORDER.length)}>
      <DotRing progress={progress} size={size.tierRing} intro={intro}>
        <Text variant="label" tone={dim ? 'muted' : 'text'} maxFontSizeMultiplier={1} importantForAccessibility="no">
          {copy.league.tierInitial(tierName)}
        </Text>
      </DotRing>
    </View>
  );
}
