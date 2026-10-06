import { View, type StyleProp, type ViewStyle } from 'react-native';
import { dots, useTheme } from '@/theme';

interface Props {
  /** Pevný počet teček (ghost řádek, krátká osa). Bez něj linka vyplní šířku rodiče (flex 1) a přebytek se ořízne. */
  count?: number;
  /** `dim` (výchozí, oddělovač) nebo `off` (ghost obsah, ještě tišší). */
  tone?: 'dim' | 'off';
  style?: StyleProp<ViewStyle>;
}

/**
 * Tečková linka (Nothing Dot fáze 2): oddělovač zóny ligy, ghost řádky zamčeného náhledu. Z RN View, ne ze Skia:
 * na webu nežere rozpočet WebGL pláten (≤ 12 na obrazovku), a linka je statická, takže plátno nic nepřináší.
 * Vždy dekorativní: význam nese mono štítek vedle.
 */
export function DotRule({ count, tone = 'dim', style }: Props) {
  const { c, radius } = useTheme();
  const n = count ?? dots.rule.max;
  const color = tone === 'dim' ? c.dotDim : c.dotOff;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: dots.rule.gap, overflow: 'hidden', height: dots.rule.d },
        count === undefined ? { flex: 1 } : null,
        style,
      ]}
    >
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ width: dots.rule.d, height: dots.rule.d, borderRadius: radius.full, backgroundColor: color }} />
      ))}
    </View>
  );
}
