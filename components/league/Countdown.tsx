import { Telemetry } from '@/components/ui/Telemetry';
import { copy } from '@/data/copy';
import { useNow } from '@/hooks/useNow';
import { formatCountdown } from '@/logic/league';

/** Odpočet do konce týdne jako telemetrický pruh `KONEC TÝDNE: 3D 14H 22M` (R42), překresluje se
 *  každých 30 s (useNow). Tichý údaj pod hlavním číslem (pozice), ne druhý hero. */
export function Countdown({ endsAt }: { endsAt: Date }) {
  const now = useNow(30_000);
  const { d, h, m } = formatCountdown(endsAt.getTime() - now.getTime());
  return (
    <Telemetry items={[{ key: copy.league.endsIn, value: copy.league.countdown(d, h, m), a11y: copy.league.countdownA11y(d, h, m) }]} />
  );
}
