import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useNow } from '@/hooks/useNow';
import { formatCountdown } from '@/logic/league';

/** Odpočet do konce týdne (Teplá litina §3.2): tichá věta `caption muted` „Týden končí za 3 d 14 h 22 min“,
 *  bez instrumentální telemetrie. Překresluje se každých 30 s (useNow). */
export function Countdown({ endsAt }: { endsAt: Date }) {
  const now = useNow(30_000);
  const { d, h, m } = formatCountdown(endsAt.getTime() - now.getTime());
  return (
    <Text variant="caption" tone="muted" accessibilityLabel={copy.league.countdownA11y(d, h, m)}>
      {copy.league.endsInLine(d, h, m)}
    </Text>
  );
}
