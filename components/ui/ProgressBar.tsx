import { View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  value: number;
  max: number;
  /** Hlasitý popis, např. „Shyby 8 z 15“. */
  accessibilityLabel?: string;
}

/** Progress bar (Teplá litina §2.7): stopa 6 pt v `raised` (i v kartě drží `accentGraphic` ≥ 3:1),
 *  výplň `accentGraphic`, radius full. Nula = jen stopa; číslo nad pruhem kreslí volající. */
export function ProgressBar({ value, max, accessibilityLabel }: Props) {
  const { c, size, radius } = useTheme();
  const p = max > 0 && Number.isFinite(value) ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
      style={{ height: size.meter, borderRadius: radius.full, backgroundColor: c.raised, overflow: 'hidden' }}
    >
      {p > 0 ? <View style={{ width: `${p * 100}%` as const, height: '100%', borderRadius: radius.full, backgroundColor: c.accentGraphic }} /> : null}
    </View>
  );
}
