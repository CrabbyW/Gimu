import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';
import { StatusLine, type StatusLineProps } from './StatusLine';
import { Text } from './Text';

export interface HeaderAction { icon: LucideIcon; label: string; onPress(): void }

interface Props {
  /** Titulek obrazovky v Doto (`display` 40). Krátký: jedno až dvě slova. */
  title: string;
  /** Kulatá ikonová tlačítka 44 vpravo (obr. 2), nejvýš dvě. */
  actions?: readonly HeaderAction[];
  /** Stavový řádek nad titulkem. */
  status?: StatusLineProps;
  /** Odsadit horní safe area (výchozí ano; obrazovka v SafeAreaView předá false). */
  insetTop?: boolean;
}

/** Hlavička obrazovky (spec §2.3, obr. 2): stavový řádek, pod ním Doto titulek vlevo a kulatá tlačítka vpravo.
 *  Titulek je jediný Doto prvek hlavičky; vše ostatní ustupuje (mono, `muted`). */
export function ScreenHeader({ title, actions, status, insetTop = true }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: (insetTop ? insets.top : 0) + space.s, paddingHorizontal: space.l, paddingBottom: space.m, gap: space.s }}>
      {status ? <StatusLine {...status} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m, minHeight: size.iconButton }}>
        <Text variant="display" accessibilityRole="header" numberOfLines={2} style={{ flexShrink: 1 }}>{title}</Text>
        {actions && actions.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: space.s }}>
            {actions.map(({ icon: Icon, label, onPress }) => (
              <Pressable
                key={label}
                onPress={onPress}
                onPressIn={() => feedback('tapLight')}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={({ pressed }) => ({
                  width: size.iconButton, height: size.iconButton, borderRadius: radius.full,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: pressed ? c.tilePressed : c.tile,
                  borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
                })}
              >
                <Icon size={size.icon} color={c.text} strokeWidth={stroke.icon} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
