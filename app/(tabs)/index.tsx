import { View } from 'react-native';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/theme';

// Dočasná obrazovka tabu Trénink: jen štítek a název zvolené cesty. Mapu staví Task 11.
export default function TrainingScreen() {
  const { space } = useTheme();
  const profile = useProfile();
  const path = useLessonPath(profile.status === 'ready' ? profile.data?.path : undefined);
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (path.status === 'error') return <ErrorState what={copy.common.loadTarget.path} onRetry={path.retry} />;
  return (
    <Screen>
      {path.status === 'ready' ? (
        <View style={{ paddingTop: space.xl, gap: space.s }}>
          <Text variant="label" tone="muted">{copy.tabs.training}</Text>
          <Text variant="display" accessibilityRole="header">{path.data.path.name}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
