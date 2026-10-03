// Importy po řezech: kořen balíčku by do bundlu přibalil všechny váhy (desítky TTF).
// R42: display je Inter 300 Light; Bebas Neue se už nenačítá (balíček zůstává, nic ho neimportuje).
import { Inter_300Light } from '@expo-google-fonts/inter/300Light';
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
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { useActiveSeason } from '@/hooks/useActiveSeason';
import { useHydrated } from '@/hooks/useHydrated';
import { useReminderSync } from '@/hooks/useReminderSync';
import { ThemeProvider, useTheme } from '@/theme';
import { preloadSounds } from '@/lib/sound';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_300Light, Inter_400Regular, Inter_600SemiBold, JetBrainsMono_500Medium });
  const hydrated = useHydrated();
  const season = useActiveSeason();
  useEffect(() => { if (fontError) console.warn('[fonts] načtení selhalo, pokračuji se systémovým písmem', fontError); }, [fontError]);
  // Splash drží, dokud nejsou fonty i uložená data (spec §9). Chyba fontů splash neblokuje.
  const ready = (fontsLoaded || fontError != null) && hydrated;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => undefined); }, [ready]);
  // Přehrávače jednou při startu: první zvuk oslavy bez latence dekódování (motion spec §6.2.5).
  useEffect(preloadSounds, []);
  const seasonThemeId = season.status === 'ready' ? season.data?.themeId ?? null : null;
  // Na nativu brání splash; na webu (bez splashe) je tu místo prázdna DotLoader. Fonty nepotřebuje.
  return (
    <ThemeProvider seasonThemeId={seasonThemeId}>
      {ready ? <RootStack /> : <DotLoaderScreen />}
    </ThemeProvider>
  );
}

function RootStack() {
  useReminderSync();
  const { c, scheme, font } = useTheme();
  // Navigátory dostanou barvy z tokenů, aby při přechodech neprosvítalo výchozí bílé pozadí.
  const navigationTheme = useMemo(() => {
    const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: { ...baseTheme.colors, primary: c.text, background: c.base, card: c.base, text: c.text, border: c.rule, notification: c.text },
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
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.base }, animation: 'fade', animationDuration: 250 }}>
            {/* UX2: lekce vyjede zespodu za 350 ms (výchozí iOS 500 ms působí líně). */}
            <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', animationDuration: 350, gestureEnabled: false }} />
            <Stack.Screen name="stage-up" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="season-goal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="season-recap" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="wardrobe" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="dev" options={{ presentation: 'modal' }} />
          </Stack>
        </NavigationThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
