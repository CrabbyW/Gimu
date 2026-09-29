import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type StatSize = 'M' | 'L' | 'XL';

interface Props { value: string | number; unit: string; label?: string; size?: StatSize }

const fontSize: Record<StatSize, number> = { M: 56, L: 88, XL: 120 };

/** Obří tabulární číslo s malou jednotkou na jeho účaří (`20 kg`, `12 dní`). */
export function Stat({ value, unit, label, size = 'M' }: Props) {
  const { space } = useTheme();
  const px = fontSize[size];
  return (
    <View accessible accessibilityLabel={[label, `${value} ${unit}`].filter(Boolean).join(', ')}>
      {label ? <Text variant="label" tone="muted" style={{ marginBottom: space.xs }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.xs }}>
        <Text variant="display" maxFontSizeMultiplier={1} style={{ fontSize: px, lineHeight: px * 0.9 }}>{value}</Text>
        <Text variant="caption" tone="muted" style={{ marginBottom: px * 0.12 }}>{unit}</Text>
      </View>
    </View>
  );
}
