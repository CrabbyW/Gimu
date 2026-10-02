import { useRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { typography, useTheme } from '@/theme';
import { useRevealOnFocus } from './revealOnFocus';
import { Text } from './Text';

interface Props extends Omit<TextInputProps, 'style' | 'selectionColor' | 'placeholderTextColor'> {
  label: string;
  /** Jednotka vpravo v poli (např. `kg`). */
  unit?: string;
  error?: string | null;
}

/** Pole s mono štítkem nad sebou a jedinou spodní linkou, která při fokusu zesílí na `stroke.focus` v `text` (bez akcentu, R42). */
export function TextField({ label, unit, error, onFocus, onBlur, ...input }: Props) {
  const { c, space, size, stroke } = useTheme();
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  // Celý blok (štítek, pole, chyba), aby nad klávesnicí bylo vidět i chybové hlášení.
  const block = useRef<View>(null);
  return (
    <View ref={block} style={{ gap: space.s }}>
      <Text variant="label" tone="muted">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, borderBottomWidth: focused ? stroke.focus : 1, marginBottom: focused ? 0 : stroke.focus - 1, borderBottomColor: focused ? c.text : c.rule }}>
        <TextInput
          {...input}
          accessibilityLabel={input.accessibilityLabel ?? label}
          onFocus={(e) => { setFocused(true); reveal?.focus(block.current); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); reveal?.blur(block.current); onBlur?.(e); }}
          selectionColor={c.muted}
          cursorColor={c.text}
          placeholderTextColor={c.muted}
          style={{ ...typography.input, color: c.text, flex: 1, minHeight: size.control, paddingVertical: space.s }}
        />
        {unit ? <Text variant="caption" tone="muted">{unit}</Text> : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: c.danger }} accessibilityLiveRegion="polite">{error}</Text>
      ) : null}
    </View>
  );
}
