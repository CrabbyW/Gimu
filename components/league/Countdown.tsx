import { View } from 'react-native';
import { copy } from '@/data/copy';
import { useNow } from '@/hooks/useNow';
import { formatCountdown } from '@/logic/league';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui/Text';

/** Odpočet do konce týdne `3D 14H 22M`, překresluje se každých 30 s (useNow). */
export function Countdown({ endsAt }: { endsAt: Date }) {
  const { space } = useTheme();
  const now = useNow(30_000);
  const { d, h, m } = formatCountdown(endsAt.getTime() - now.getTime());
  return (
    <View accessible accessibilityLabel={copy.league.countdownA11y(d, h, m)} style={{ gap: space.xs }}>
      <Text variant="label" tone="muted">{copy.league.endsIn}</Text>
      <Text variant="counter" maxFontSizeMultiplier={1}>{copy.league.countdown(d, h, m)}</Text>
    </View>
  );
}
