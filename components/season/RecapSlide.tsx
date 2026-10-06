import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { layout, useTheme } from '@/theme';

interface Props {
  /** Mono štítek slidu, např. „LEKCÍ“. */
  kicker: string;
  /** Jeden obří údaj slidu (Doto). Bez něj nese slide obsah `children` (opice, odměna). */
  value?: string | number;
  unit?: string;
  /** Jedna věta pod údajem. */
  line?: string;
  /** Doplňkový řádek (PŘED / PO, akce) pod větou. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Oslavná scéna (odměna splněna): obsah v `onAccent`; plochu kreslí obrazovka přes celý displej. */
  onAccent?: boolean;
}

/**
 * Jeden snímek recapu (Nothing Dot fáze 2): mono štítek, jedno obří Doto číslo (`displayXL`, pod `layout.narrow`
 * `hero`) s malou jednotkou, jedna věta. Zarovnáno vlevo, údaj v optickém středu výšky jako titul plakátu.
 * Pozadí (tečkové pole) kreslí obrazovka, slide je jen typografie.
 */
export function RecapSlide({ kicker, value, unit, line, footer, children, onAccent = false }: Props) {
  const { space } = useTheme();
  const { width } = useWindowDimensions();
  const tone = onAccent ? 'onAccent' : 'text';
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.l, paddingBottom: space.xxl, gap: space.l }}>
      <Text variant="label" tone={onAccent ? 'onAccent' : 'muted'} accessibilityRole="header">{kicker}</Text>
      {value !== undefined ? (
        <View accessible accessibilityLabel={`${value} ${unit ?? ''}`.trim()} style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.s }}>
          <Text variant={width >= layout.narrow ? 'displayXL' : 'hero'} tone={tone} numberOfLines={1}>{value}</Text>
          {unit ? <Text variant="headline" tone={onAccent ? 'onAccent' : 'muted'}>{unit}</Text> : null}
        </View>
      ) : null}
      {children}
      {line ? <Text variant="body" tone={onAccent ? 'onAccent' : 'muted'}>{line}</Text> : null}
      {footer}
    </View>
  );
}
