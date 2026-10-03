import { Lock } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

interface Props {
  title: string;
  body: string;
  /** Volitelná primární akce (jedna na obrazovce). */
  cta?: { label: string; onPress(): void };
  style?: StyleProp<ViewStyle>;
}

const GHOST_WIDTHS = ['100%', '80%', '60%'] as const;

/** Zamčený náhled (Teplá litina §2.7): karta `surface`, `Lock` + `headline`, vysvětlení `body muted`,
 *  tři ghost řádky (pruhy `faint` přímo na `surface`, na `raised` by dark `faint` neměl 3:1) a volitelné primary.
 *  Bez maskota: zamčený stav nemá být smutný ani roztomilý, jen srozumitelný. */
export function LockedPreview({ title, body, cta, style }: Props) {
  const { c, space, radius, size, stroke } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius.l, padding: space.l, gap: space.m }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
        <Lock size={size.lockIcon} color={c.muted} strokeWidth={stroke.icon} />
        <Text variant="headline" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Text>
      </View>
      <Text tone="muted">{body}</Text>
      <View style={{ gap: space.s }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {GHOST_WIDTHS.map((w) => (
          <View key={w} style={{ width: w, height: size.ghostRow, borderRadius: radius.full, backgroundColor: c.faint }} />
        ))}
      </View>
      {cta ? <Button label={cta.label} onPress={cta.onPress} style={{ marginTop: space.s }} /> : null}
    </View>
  );
}
