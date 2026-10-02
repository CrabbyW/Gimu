import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import type { ISODate } from '@/types';
import { shortDate } from './format';

interface Props { repairWindow: readonly ISODate[]; reachable: boolean }

/**
 * Comeback (§7.7, §6.5): co jde dohnat a dokdy. Tón je výzva, nikdy prohra. Okno je telemetrie
 * se skutečnými daty, aby bylo jasné, které dny druhá lekce opraví.
 */
export function ComebackCard({ repairWindow, reachable }: Props) {
  const { space } = useTheme();
  const n = repairWindow.length;
  return (
    <Card style={{ padding: space.l, gap: space.s }}>
      <Text variant="choiceTitle" accessibilityRole="header">{copy.season.comebackTitle}</Text>
      <Text variant="body" tone="muted">{n > 0 ? copy.season.comebackBody(n) : copy.season.comebackEmpty}</Text>
      {n > 0 ? (
        <Telemetry items={[{ key: copy.season.comebackWindow, value: repairWindow.map(shortDate).join(' · ') }]} style={{ marginTop: space.xs }} />
      ) : null}
      {!reachable ? (
        <View style={{ marginTop: space.s }}>
          <Text variant="body">{copy.season.unreachable}</Text>
        </View>
      ) : null}
    </Card>
  );
}
