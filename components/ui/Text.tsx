import { Text as RNText, type TextProps } from 'react-native';
import { typography, useTheme, type Colors, type TypeVariant } from '@/theme';

export type TextTone = 'text' | 'muted' | 'faint' | 'accent' | 'onAccent' | 'inverse';

interface Props extends TextProps { variant?: TypeVariant; tone?: TextTone }

// Akcent jako text má vlastní token (v light režimu tmavší kvůli kontrastu).
// `inverse` = podklad jako inkoust na plné `text` ploše (primární CTA podle R42).
const toneColor: Record<TextTone, keyof Colors> = { text: 'text', muted: 'muted', faint: 'faint', accent: 'accentText', onAccent: 'onAccent', inverse: 'base' };
// Strop systémového zvětšení písma je součást typografie (spec §2.4): velká čísla a prvky v pevné
// geometrii (tab bar, nadpis sekce) rostou méně, aby nerozbily layout.
const maxScale: Partial<Record<TypeVariant, number>> = {
  displayXL: 1, hero: 1.2, display: 1.3, title: 1.5, choiceTitle: 1.3, headline: 1.6, bodyStrong: 1.6, body: 2, caption: 1.8,
  label: 1.3, tab: 1.3, stat: 1.4, dotStat: 1.3, pill: 1.3,
};
// Tabulární číslice jen u čísel a štítků (R18). Inter v tnum rozšiřuje i spojovník,
// takže běžný text („muscle-up“, „-3 kg“) má proporcionální číslice.
const TABULAR: Record<TypeVariant, boolean> = {
  hero: true, headline: false, stat: true, tab: false,
  displayXL: true, display: true, title: true, choiceTitle: false, label: true, body: false, bodyStrong: false, caption: false,
  input: false, inputLarge: false, counter: true, badgeLabel: true, tierName: false, telemetry: true, tabLabelCompact: true, dotStat: true, pill: true,
};
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
