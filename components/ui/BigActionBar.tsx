import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { PillButton } from './PillButton';
import { fitsRoundCta, RoundCta, type CtaAction } from './RoundCta';
import { useKeyboardVisible } from './useKeyboardVisible';

interface Props { primary: CtaAction; secondary?: { label: string; onPress(): void } }

/** Spodní akční lišta (Nothing Dot §2.3, obr. 1): pilulky vedle sebe na `base`, bez dělicí linky.
 *  Vlevo sekundární pilulka `tile`, vpravo primární plná `text`; s krátkým popiskem dělí šířku napůl,
 *  s dlouhým dostane primární dvě třetiny. Sama odsazuje spodní safe area. */
export function BigActionBar({ primary, secondary }: Props) {
  const { c, space } = useTheme();
  const insets = useSafeAreaInsets();
  // Nad klávesnicí (KeyboardAvoidingView) by spodní safe area byla jen mrtvý pruh.
  const keyboardVisible = useKeyboardVisible();
  const primaryFlex = fitsRoundCta(primary.label) ? 1 : 2;
  return (
    <View
      style={{
        flexDirection: 'row', gap: space.s, paddingHorizontal: space.m, paddingTop: space.s,
        paddingBottom: (keyboardVisible ? 0 : insets.bottom) + space.m,
        // Na akcentové ploše oslavy (stage-up) lišta plochu nepřerušuje.
        backgroundColor: primary.onAccent || primary.onGold ? 'transparent' : c.base,
      }}
    >
      {secondary ? (
        <View style={{ flex: 1 }}>
          <PillButton label={secondary.label} onPress={secondary.onPress} variant="secondary" onAccent={primary.onAccent} onGold={primary.onGold} />
        </View>
      ) : null}
      <View style={{ flex: secondary ? primaryFlex : 1 }}>
        <RoundCta {...primary} />
      </View>
    </View>
  );
}
