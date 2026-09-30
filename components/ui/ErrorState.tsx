import { View } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

interface Props {
  /** Co se nepodařilo načíst, ve 4. pádě (`copy.common.loadTarget.*`). Nepoužije se, když je zadané `message`. */
  what?: string;
  /** Vlastní zpráva místo standardního „Nepodařilo se načíst …“ (např. zamčená lekce). */
  message?: string;
  /** Popisek akčního tlačítka; výchozí je `copy.common.retry`. */
  actionLabel?: string;
  onRetry(): void;
}

/** Jednotný chybový stav obrazovky (spec §9): co selhalo a jak to zkusit znovu. Zarovnáno vlevo. */
export function ErrorState({ what, message, actionLabel, onRetry }: Props) {
  const { space } = useTheme();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.l }}>
        <Text variant="title" accessibilityRole="alert">{message ?? copy.common.loadError(what ?? '')}</Text>
        <Button label={actionLabel ?? copy.common.retry} onPress={onRetry} variant="secondary" />
      </View>
    </Screen>
  );
}
