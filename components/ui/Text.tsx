import { Text as RNText, type TextProps } from 'react-native';
import { typography, useTheme, type Colors, type TypeVariant } from '@/theme';

export type TextTone = 'text' | 'muted' | 'accent' | 'onAccent';

interface Props extends TextProps { variant?: TypeVariant; tone?: TextTone }

// Akcent jako text má vlastní token (v light režimu tmavší kvůli kontrastu).
const toneColor: Record<TextTone, keyof Colors> = { text: 'text', muted: 'muted', accent: 'accentText', onAccent: 'onAccent' };
// Display řezy jsou už tak obří; systémové zvětšení písma je omezené, aby nerozbilo layout.
const maxScale: Partial<Record<TypeVariant, number>> = { displayXL: 1, display: 1.15, title: 1.3 };
// Tabulární číslice jen u čísel a štítků (R18). Inter v tnum rozšiřuje i spojovník,
// takže běžný text („muscle-up“, „-3 kg“) má proporcionální číslice.
const TABULAR: Record<TypeVariant, boolean> = { displayXL: true, display: true, title: true, label: true, body: false, bodyStrong: false, caption: false };
const tabular = { fontVariant: ['tabular-nums' as const] };

export function Text({ variant = 'body', tone = 'text', style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant]}
      {...rest}
      style={[typography[variant], { color: c[toneColor[tone]] }, TABULAR[variant] ? tabular : null, style]}
    />
  );
}
