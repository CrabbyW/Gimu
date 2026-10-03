import { View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Text } from './Text';

/** Řádek „Dnes hotovo / Dnes čeká“ (Teplá litina §2.7, nahrazuje denní cíl): série = 1 lekce denně,
 *  stav je binární, proto tečka a ne progress bar. Čeká = obrys `accentGraphic` + text `muted`,
 *  hotovo = plná tečka + text `text`. */
export function TodayStatus({ status }: { status: 'done' | 'pending' }) {
  const { c, space, size, stroke, radius } = useTheme();
  const done = status === 'done';
  return (
    <View accessible accessibilityRole="text" style={{ minHeight: size.todayRow, flexDirection: 'row', alignItems: 'center', gap: space.s }}>
      <View
        style={{
          width: size.todayDot, height: size.todayDot, borderRadius: radius.full,
          backgroundColor: done ? c.accentGraphic : 'transparent',
          borderWidth: done ? 0 : stroke.todayDot, borderColor: c.accentGraphic,
        }}
      />
      <Text variant="caption" tone={done ? 'text' : 'muted'}>{done ? copy.today.done : copy.today.pending}</Text>
    </View>
  );
}
