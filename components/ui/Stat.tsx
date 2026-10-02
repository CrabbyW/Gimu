import { View } from 'react-native';
import { statSize, tracking, useTheme, type StatSize } from '@/theme';
import { Text, type TextTone } from './Text';

export type { StatSize };

interface Props {
  value: string | number; unit: string; label?: string; size?: StatSize;
  /** Barva čísla; akcent jen tam, kde je číslo subjektem obrazovky (+XP v oslavě). */
  tone?: TextTone;
}

// Optické vyrovnání první číslice na levou hranu štítku (v em). Odhad pro Inter Light s tabulárními
// číslicemi (R42): běžná číslice má levý přesah ~0.04 em, úzká „1“ v široké buňce ~0.12 em.
// K ověření na screenshotu (dřív změřeno pro Bebas: 0.03 / 0.07).
const opticalInset = (value: string | number): number => (String(value).replace(/^\+/, '').startsWith('1') ? 0.12 : 0.04);

/** Obří tabulární číslo s malou jednotkou na jeho účaří (`20 kg`, `12 dní`). */
export function Stat({ value, unit, label, size = 'M', tone = 'text' }: Props) {
  const { space } = useTheme();
  const px = statSize[size];
  // Na akcentové ploše oslavy by `muted` jednotka zanikla: štítek i jednotka přejdou do `onAccent`.
  const quiet: TextTone = tone === 'onAccent' ? 'onAccent' : 'muted';
  return (
    <View accessible accessibilityLabel={[label, `${value} ${unit}`].filter(Boolean).join(', ')}>
      {label ? <Text variant="label" tone={quiet} style={{ marginBottom: space.xs }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.xs }}>
        <Text variant="display" tone={tone} maxFontSizeMultiplier={1} style={{ fontSize: px, lineHeight: px * 1.05, letterSpacing: px * tracking.display, marginLeft: -px * opticalInset(value) }}>{value}</Text>
        <Text variant="caption" tone={quiet} style={{ marginBottom: px * 0.18 }}>{unit}</Text>
      </View>
    </View>
  );
}
