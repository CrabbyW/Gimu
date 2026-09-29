import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { RoundCta, type CtaAction } from './RoundCta';
import { Text } from './Text';

interface Props { primary: CtaAction; secondary?: { label: string; onPress(): void } }

/** Spodní akční lišta rozdělená na buňky (ref. 3): vlevo vedlejší akce, vpravo velké CTA.
 *  Sama odsazuje spodní safe area, obrazovka nad ní proto spodní hranu neodsazuje. */
export function BigActionBar({ primary, secondary }: Props) {
  const { c, space } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingBottom: insets.bottom, backgroundColor: c.base }}>
      {secondary ? (
        <Pressable
          onPress={secondary.onPress}
          accessibilityRole="button"
          accessibilityLabel={secondary.label}
          style={({ pressed }) => ({
            flex: 1, minHeight: 96, justifyContent: 'center', paddingHorizontal: space.l,
            borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.rule,
            backgroundColor: pressed ? c.surface : 'transparent',
          })}
        >
          <Text variant="label" tone="muted">{secondary.label}</Text>
        </Pressable>
      ) : <View style={{ flex: 1 }} />}
      <View style={{ flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center', paddingVertical: space.m, paddingHorizontal: space.m }}>
        <RoundCta {...primary} />
      </View>
    </View>
  );
}
