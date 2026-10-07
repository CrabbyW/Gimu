import { Platform, Text as RNText, type TextProps } from 'react-native';
import { tabularNums, tabularVariants, typeMaxScale, typography, useTheme, type Colors, type TypeVariant } from '@/theme';

export type TextTone = 'text' | 'muted' | 'faint' | 'accent' | 'onAccent' | 'inverse';

interface Props extends TextProps { variant?: TypeVariant; tone?: TextTone }

// Akcent jako text má vlastní token (v light režimu tmavší kvůli kontrastu).
// `inverse` = podklad jako inkoust na plné `text` ploše (primární CTA podle R42).
const toneColor: Record<TextTone, keyof Colors> = { text: 'text', muted: 'muted', faint: 'faint', accent: 'accentText', onAccent: 'onAccent', inverse: 'base' };

/** Strop zvětšení (`typeMaxScale`) a tabulární číslice (`tabularVariants`) jdou z theme. */
export function Text({ variant = 'body', tone = 'text', style, ...rest }: Props) {
  const { c } = useTheme();
  // Web neumí systémové zvětšení písma: strop a fit pro e2e simulaci 1.4× (`e2e/textGeometry.ts`) jdou do data-* atributů.
  const web = Platform.OS === 'web'
    ? ({ dataSet: { fs: rest.maxFontSizeMultiplier ?? typeMaxScale[variant] ?? 0, fit: rest.adjustsFontSizeToFit ? 1 : 0 } } as object)
    : null;
  return (
    <RNText
      maxFontSizeMultiplier={typeMaxScale[variant]}
      {...web}
      {...rest}
      style={[typography[variant], { color: c[toneColor[tone]] }, tabularVariants[variant] ? tabularNums : null, style]}
    />
  );
}
