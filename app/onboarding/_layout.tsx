import { Redirect, Stack } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/theme';

/** Druhý onboarding by přepsal profil a smazal `activity` (QA kolo 1).
 *  S existujícím profilem je `/onboarding/*` needosažitelné — ať už deep linkem, nebo webovým Zpět. */
export default function OnboardingLayout() {
  const { c } = useTheme();
  const profile = useProfile();
  if (profile.status === 'ready' && profile.data) return <Redirect href="/(tabs)" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true, contentStyle: { backgroundColor: c.base } }}>
      {/* Zrození je konec cesty: zpět swipem by se vracelo do rozpracovaného formuláře uprostřed oslavy. */}
      <Stack.Screen name="birth" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
