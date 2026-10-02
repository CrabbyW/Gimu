import { View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  value: number;
  max: number;
  /** Hlasitý popis, např. „Shyby 8 z 15“. */
  accessibilityLabel?: string;
}

/** Plná stopa průběhu (R42): `rule` stopa, prošlý úsek v `text`, hrany rovné (obrobený kov, ne pilulka).
 *  Pro průběh s popiskem a tiky je `MeasureLine`; ProgressBar je jeho tichý bratr do řádků. */
export function ProgressBar({ value, max, accessibilityLabel }: Props) {
  const { c, size } = useTheme();
  const p = max > 0 && Number.isFinite(value) ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
      style={{ height: size.meter, backgroundColor: c.rule, overflow: 'hidden' }}
    >
      <View style={{ width: `${p * 100}%` as const, height: '100%', backgroundColor: c.text }} />
    </View>
  );
}
