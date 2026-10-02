import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  /** Průběh 0–1 (mimo rozsah se ořízne). */
  progress: number;
  /** Mono popisek vlevo nad linkou, např. „SEKCE 01“. */
  label?: string;
  /** Hodnota vpravo nad linkou, např. „03/08“. */
  value?: string;
  accessibilityLabel: string;
  /** Linka leží na akcentové ploše oslavy: vše v `onAccent`, prošlý úsek odliší jen tloušťka. */
  onAccent?: boolean;
  /** Jen pro umístění v layoutu. */
  style?: StyleProp<ViewStyle>;
}

/** Měřicí linka (R42): vlasová osa v `rule` s koncovými tiky, prošlý úsek v `text`
 *  zakončený vlastním tikem. Progres nese kontrast, ne akcent. */
export function MeasureLine({ progress, label, value, accessibilityLabel, onAccent = false, style }: Props) {
  const { c: theme, space, size, stroke } = useTheme();
  // Na akcentu je jediný čitelný inkoust `onAccent`: osa, tiky i prošlý úsek.
  const c = onAccent ? { ...theme, rule: theme.onAccent, muted: theme.onAccent, text: theme.onAccent } : theme;
  const tone = onAccent ? 'onAccent' : undefined;
  const p = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 1);
  const pct = `${p * 100}%` as const;
  const tick = (left: ViewStyle['left'], color: string) => (
    <View style={{ position: 'absolute', left, top: 0, width: 1, height: size.tick, backgroundColor: color, marginLeft: left === '100%' ? -1 : 0 }} />
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
      style={[{ gap: space.xs }, style]}
    >
      {label || value ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s }}>
          <Text variant="telemetry" tone={tone ?? 'muted'} numberOfLines={1} style={{ flexShrink: 1 }}>{label ?? ''}</Text>
          {value ? <Text variant="telemetry" tone={tone ?? 'text'}>{value}</Text> : null}
        </View>
      ) : null}
      <View style={{ height: size.tick }}>
        {/* Osa uprostřed výšky tiku. */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: (size.tick - 1) / 2, height: 1, backgroundColor: c.rule }} />
        <View style={{ position: 'absolute', left: 0, width: pct, top: (size.tick - stroke.measure) / 2, height: stroke.measure, backgroundColor: c.text }} />
        {tick(0, c.muted)}
        {tick('100%', c.muted)}
        {p > 0 && p < 1 ? tick(pct, c.text) : null}
      </View>
    </View>
  );
}
