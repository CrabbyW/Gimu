import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { View } from 'react-native';
import { DotRule } from '@/components/ui/DotRule';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Hranice zóny (Nothing Dot fáze 2): Lucide šipka `muted`, mono štítek „POSTUP“ / „SESTUP“ a tečková linka
 *  do konce řádku. Směr nese tvar šipky, ne barva (žádná zelená/červená). Linka z View, bez plátna. */
export function ZoneDivider({ kind }: { kind: 'promote' | 'demote' }) {
  const { c, space, size, stroke } = useTheme();
  const label = kind === 'promote' ? copy.league.promote : copy.league.demote;
  const Icon = kind === 'promote' ? ChevronUp : ChevronDown;
  return (
    <View
      // Zóna je popisek v tabulce, ne nadpis: jediný nadpis obrazovky je titulek hlavičky.
      accessible
      accessibilityLabel={label}
      style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.l }}
    >
      <Icon size={size.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
      <Text variant="label" tone="muted">{label}</Text>
      <DotRule />
    </View>
  );
}
