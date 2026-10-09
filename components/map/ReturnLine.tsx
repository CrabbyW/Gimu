import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import type { ReturnLine as Line } from '@/hooks/useReturnLine';
import { useTheme } from '@/theme';

/**
 * Důvod se vrátit (UX pass U4): jeden odstavec Inter `caption` pod pokrokem sekce, max. 2 řádky, žádná kolize
 * ani na 320 pt (text se zalomí, ne překryje). Stav série první a v `text` (jasná informace, ne výčitka:
 * „Streak ends tonight.“ / „Done today · see you tomorrow.“), za ním tlumeně další lekce s minutami.
 * Bez série a bez další lekce se nic nevykreslí.
 */
export function ReturnLine({ line }: { line: Line }) {
  const { space } = useTheme();
  const status = line.risk === 'atRisk' ? copy.returnLine.atRisk : line.risk === 'done' ? copy.returnLine.done : null;
  const next = line.next ? copy.returnLine.next(line.next.title, line.next.minutes) : null;
  if (!status && !next) return null;
  return (
    <View testID="return-line" style={{ paddingHorizontal: space.l, paddingBottom: space.s }}>
      <Text variant="caption" tone="muted" numberOfLines={2}>
        {status ? <Text variant="caption" testID="return-status">{status}</Text> : null}
        {status && next ? ' ' : null}
        {next ? <Text variant="caption" tone="muted" testID="return-next">{next}</Text> : null}
      </Text>
    </View>
  );
}
