import { View } from 'react-native';
import { statSize, useTheme, type StatSize } from '@/theme';
import { Text, type TextTone } from './Text';

export type { StatSize };

interface Props {
  value: string | number; unit: string; label?: string; size?: StatSize;
  /** Barva čísla; akcent jen tam, kde je číslo subjektem obrazovky (+XP v oslavě). */
  tone?: TextTone;
}

// Optické vyrovnání první číslice na levou hranu štítku (v em, změřeno ze screenshotů):
// Bebas má u číslic levý přesah ~0.03 em, „1“ s praporkem ~0.07 em.
const opticalInset = (value: string | number): number => (String(value).startsWith('1') ? 0.07 : 0.03);

/** Obří tabulární číslo s malou jednotkou na jeho účaří (`20 kg`, `12 dní`). */
export function Stat({ value, unit, label, size = 'M', tone = 'text' }: Props) {
  const { space } = useTheme();
  const px = statSize[size];
  return (
    <View accessible accessibilityLabel={[label, `${value} ${unit}`].filter(Boolean).join(', ')}>
      {label ? <Text variant="label" tone="muted" style={{ marginBottom: space.xs }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.xs }}>
        <Text variant="display" tone={tone} maxFontSizeMultiplier={1} style={{ fontSize: px, lineHeight: px * 0.9, marginLeft: -px * opticalInset(value) }}>{value}</Text>
        <Text variant="caption" tone="muted" style={{ marginBottom: px * 0.12 }}>{unit}</Text>
      </View>
    </View>
  );
}
