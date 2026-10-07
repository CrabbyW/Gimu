import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Kroky „Finish setup“: vize, milníky, váha, připomínka (app/setup.tsx). */
export const SETUP_STEPS = 4;

/**
 * Mapa, krátký onboarding (elite fáze 1): jednořádková dlaždice „FINISH SETUP · 4 STEPS ›“ v hlavičkovém
 * překryvu. Výška = dotyková plocha 44 (`size.hit`), ne karta: cestě nesmí ubrat místo. Mono štítek, živá tečka
 * v barvě textu (jediný „aktivní“ signál, žádný akcent). Zmizí po `completeSetup()` (volající ji nevykreslí).
 */
export function FinishSetupTile() {
  const { c, space, size, radius, stroke } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/setup')}
      accessibilityRole="button"
      accessibilityLabel={copy.setup.tileA11y(SETUP_STEPS)}
      style={({ pressed }) => ({
        minHeight: size.hit, marginHorizontal: space.l, marginTop: space.s,
        flexDirection: 'row', alignItems: 'center', gap: space.s, paddingHorizontal: space.m,
        backgroundColor: pressed ? c.tilePressed : c.tile,
        borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
      })}
    >
      <View style={{ width: size.liveDot, height: size.liveDot, borderRadius: size.liveDot / 2, backgroundColor: c.text }} />
      <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>{copy.setup.tile(SETUP_STEPS)}</Text>
      <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
    </Pressable>
  );
}
