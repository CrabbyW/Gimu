import { Medal } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import type { Cosmetic } from '@/types';

interface Props {
  cosmetic: Cosmetic;
  /** Název sezóny pro sezónní položku (UI nečte data/, předá ho obrazovka). */
  seasonName?: string;
  owned: boolean;
}

/** Text pravidla milníkové položky („Splň 2 milníky“, „Streak 7 dní“). */
export const ruleText = (c: Cosmetic): string =>
  !c.milestoneRule ? '' : c.milestoneRule.kind === 'milestoneCompleted'
    ? copy.wardrobe.lock.milestoneCompleted(c.milestoneRule.count) : copy.wardrobe.lock.streak(c.milestoneRule.days);

/** Štítek původu (§7.8). Sezónní = plný `seasonGold` + Medal + název a „Už nikdy nevyjde“ (prestiž, materiál,
 *  ne akcent). Milník = obrys `rule` + Medal + pravidlo. Obchod = jen cena v `muted`, bez rámečku (tišší). */
export function SourceBadge({ cosmetic, seasonName, owned }: Props) {
  const { c, space, radius, stroke, size } = useTheme();
  const icon = size.badgeIcon;
  if (cosmetic.source === 'season') {
    return (
      <View style={{ alignSelf: 'flex-start', backgroundColor: c.seasonGold, borderRadius: radius.s, paddingHorizontal: space.s, paddingVertical: space.xs, gap: space.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <Medal size={icon} color={c.onSeasonGold} strokeWidth={stroke.icon} />
          <Text variant="badgeLabel" numberOfLines={1} style={{ color: c.onSeasonGold, flexShrink: 1 }}>{seasonName ?? copy.wardrobe.seasonUnknown}</Text>
        </View>
        <Text variant="badgeLabel" numberOfLines={2} style={{ color: c.onSeasonGold }}>{copy.wardrobe.seasonNever}</Text>
      </View>
    );
  }
  if (cosmetic.source === 'milestone') {
    return (
      <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space.xs, borderWidth: 1, borderColor: c.rule, borderRadius: radius.s, paddingHorizontal: space.s, paddingVertical: space.xs }}>
        <Medal size={icon} color={c.text} strokeWidth={stroke.icon} />
        <Text variant="badgeLabel" numberOfLines={2} style={{ flexShrink: 1 }}>{ruleText(cosmetic)}</Text>
      </View>
    );
  }
  return (
    <Text variant="badgeLabel" tone="muted" numberOfLines={1}>
      {owned ? copy.wardrobe.owned : copy.wardrobe.price(cosmetic.priceBananas ?? 0)}
    </Text>
  );
}
