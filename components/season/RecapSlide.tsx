import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface Props {
  /** Mono štítek slidu, např. „LEKCÍ“. */
  kicker: string;
  /** Jeden obří údaj slidu (Stat XL). Bez něj nese slide obsah `children` (opice, odměna). */
  value?: string | number;
  unit?: string;
  /** Jedna věta pod údajem. */
  line?: string;
  /** Doplňkový řádek (telemetrie „PŘED / PO“, akce) pod větou. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Oslavná scéna (odměna splněna): obsah v `onAccent`; plochu kreslí obrazovka přes celý displej. */
  onAccent?: boolean;
}

/**
 * Jeden snímek recapu (§7.7): štítek, jeden obří tabulární údaj, jedna věta. Zarovnáno vlevo,
 * údaj sedí v optickém středu výšky (lehce nad ním), aby četl jako titul plakátu, ne jako formulář.
 */
export function RecapSlide({ kicker, value, unit, line, footer, children, onAccent = false }: Props) {
  const { space } = useTheme();
  const tone = onAccent ? 'onAccent' : 'text';
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.l, paddingBottom: space.xxl, gap: space.l }}>
      <Text variant="label" tone={onAccent ? 'onAccent' : 'muted'} accessibilityRole="header">{kicker}</Text>
      {value !== undefined ? <Stat value={value} unit={unit ?? ''} size="XL" tone={tone} /> : null}
      {children}
      {line ? <Text variant="body" tone={onAccent ? 'onAccent' : 'muted'}>{line}</Text> : null}
      {footer}
    </View>
  );
}
