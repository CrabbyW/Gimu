import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface TelemetryItem {
  /** Klíč v mono verzálkách, např. „XP“. */
  key: string;
  /** Skutečná hodnota z dat (nikdy výplň). */
  value: string | number;
  /** Jednotka za hodnotou, např. „D“. */
  unit?: string;
  /** Hlasitý popis položky; bez něj se složí z klíče, hodnoty a jednotky. */
  a11y?: string;
}

interface Props {
  items: TelemetryItem[];
  /** Volitelná Lucide ikona (obrys 1.5) před pruhem. */
  icon?: ReactNode;
  /** Jen pro umístění v layoutu. */
  style?: StyleProp<ViewStyle>;
}

/** Telemetrický pruh (R42, instrument vrstva): `KLÍČ: hodnota · KLÍČ: hodnota`.
 *  Klíče a oddělovače v `muted`, hodnoty v `text` s tabulárními číslicemi. Zalamuje se jako text. */
export function Telemetry({ items, icon, style }: Props) {
  const { space } = useTheme();
  const label = items.map((i) => i.a11y ?? [i.key, i.value, i.unit].filter((p) => p !== undefined && p !== '').join(' ')).join(', ');
  return (
    <View accessible accessibilityLabel={label} style={[{ flexDirection: 'row', alignItems: 'center', gap: space.s }, style]}>
      {icon}
      <Text variant="telemetry" tone="muted" style={{ flexShrink: 1 }}>
        {items.map((i, n) => (
          <Text key={i.key} variant="telemetry" tone="muted">
            {n > 0 ? '  ·  ' : ''}{i.key}:{' '}
            <Text variant="telemetry" tone="text">{i.unit ? `${i.value} ${i.unit}` : String(i.value)}</Text>
          </Text>
        ))}
      </Text>
    </View>
  );
}
