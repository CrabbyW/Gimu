import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true, contentStyle: { backgroundColor: c.base } }}>
      {/* Zrození je konec cesty: zpět swipem by se vracelo do rozpracovaného formuláře uprostřed oslavy. */}
      <Stack.Screen name="birth" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
