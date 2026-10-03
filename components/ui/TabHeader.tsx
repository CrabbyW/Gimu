import { Settings } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  title: string;
  /** Ozubené kolo nastavení vpravo. Jen Profil (Teplá litina §3.5); ostatní taby ho nemají. */
  onSettings?(): void;
}

/** Hlavička tabu (Teplá litina §3): `title` vlevo, sentence case, bez dělicí linky (karty pod ní nesou
 *  oddělení tónem). Volitelně outline Lucide `Settings` v barvě `text`, hit 44. */
export function TabHeader({ title, onSettings }: Props) {
  const { c, space, seasonal, size, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase, paddingTop: insets.top + space.s, paddingBottom: space.s,
        minHeight: size.hitLarge + insets.top, paddingHorizontal: space.l,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m,
      }}
    >
      <Text variant="title" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Text>
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          onPressIn={() => feedback('tapLight')}
          accessibilityRole="button"
          accessibilityLabel={copy.header.settings}
          style={{ width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center', marginRight: -space.s }}
        >
          <Settings size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}
