import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

/** Hranice zóny (Teplá litina §3.2): `ChevronUp/Down` 12 `muted`, mono štítek „POSTUP“ / „SESTUP“ v `muted`,
 *  pak vlasová linka `rule`. Směr nese tvar šipky, ne zelená/červená. */
export function ZoneDivider({ kind }: { kind: 'promote' | 'demote' }) {
  const { c, space, size, stroke } = useTheme();
  const label = kind === 'promote' ? copy.league.promote : copy.league.demote;
  const Icon = kind === 'promote' ? ChevronUp : ChevronDown;
  return (
    <View
      // Zóna je popisek v tabulce, ne nadpis: jediný nadpis obrazovky je titulek v TabHeaderu.
      accessible
      accessibilityLabel={label}
      style={{ height: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.l }}
    >
      <Icon size={size.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
      <Text variant="label" tone="muted">{label}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.rule }} />
    </View>
  );
}
