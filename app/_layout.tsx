// Importy po řezech: kořen balíčku by do bundlu přibalil všechny váhy (desítky TTF).
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useHydrated } from '@/hooks/useHydrated';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Inter_400Regular, Inter_600SemiBold, JetBrainsMono_500Medium });
  const hydrated = useHydrated();
  const season = useActiveSeason();
  // Splash drží, dokud nejsou fonty i uložená data (spec §9).
  const ready = fontsLoaded && hydrated;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  if (!ready) return null;
  return (
    <ThemeProvider seasonThemeId={season.status === 'ready' ? season.data?.themeId ?? null : null}>
      <RootStack />
    </ThemeProvider>
  );
}

function RootStack() {
  const { c, scheme, font } = useTheme();
  // Navigátory dostanou barvy z tokenů, aby při přechodech neprosvítalo výchozí bílé pozadí.
  const navigationTheme = useMemo(() => {
    const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: { ...baseTheme.colors, primary: c.accent, background: c.base, card: c.base, text: c.text, border: c.rule, notification: c.accent },
      fonts: {
        regular: { fontFamily: font.body, fontWeight: 'normal' as const },
        medium: { fontFamily: font.body, fontWeight: 'normal' as const },
        bold: { fontFamily: font.bodyStrong, fontWeight: 'normal' as const },
        heavy: { fontFamily: font.bodyStrong, fontWeight: 'normal' as const },
      },
    };
  }, [scheme, c, font]);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.base }}>
      <SafeAreaProvider>
        <NavigationThemeProvider value={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.base }, animation: 'fade' }}>
            <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          </Stack>
        </NavigationThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
