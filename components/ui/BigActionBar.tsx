import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { fitsRoundCta, RoundCta, type CtaAction } from './RoundCta';
import { Text } from './Text';
import { useKeyboardVisible } from './useKeyboardVisible';

interface Props { primary: CtaAction; secondary?: { label: string; onPress(): void } }

/** Spodní akční lišta rozdělená na buňky (ref. 3): vlevo vedlejší akce, vpravo velké CTA.
 *  Sama odsazuje spodní safe area, obrazovka nad ní proto spodní hranu neodsazuje.
 *  Kulaté CTA sedí v polovině lišty; pilulka s delším popiskem („Jdeme trénovat“) dostane
 *  dvě třetiny šířky, jinak by se popisek na telefonu šířky 360–390 pt uřízl. */
export function BigActionBar({ primary, secondary }: Props) {
  const { c, space, size } = useTheme();
  const insets = useSafeAreaInsets();
  // Nad klávesnicí (KeyboardAvoidingView) by spodní safe area byla jen mrtvý pruh.
  const keyboardVisible = useKeyboardVisible();
  const primaryFlex = fitsRoundCta(primary.label) ? 1 : 2;
  return (
    <View style={{ flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule, paddingBottom: keyboardVisible ? 0 : insets.bottom, backgroundColor: c.base }}>
      {secondary ? (
        <Pressable
          onPress={secondary.onPress}
          accessibilityRole="button"
          accessibilityLabel={secondary.label}
          style={({ pressed }) => ({
            flex: 1, minHeight: size.actionBar, justifyContent: 'center', paddingHorizontal: space.l,
            borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.rule,
            backgroundColor: pressed ? c.surface : 'transparent',
          })}
        >
          <Text variant="label" tone="muted">{secondary.label}</Text>
        </Pressable>
      ) : <View style={{ flex: 1 }} />}
      <View style={{ flex: primaryFlex, minHeight: size.actionBar, alignItems: 'center', justifyContent: 'center', paddingVertical: space.m, paddingHorizontal: space.m }}>
        <RoundCta {...primary} />
      </View>
    </View>
  );
}
