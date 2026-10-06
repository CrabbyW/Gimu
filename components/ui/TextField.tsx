import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { typography, useTheme } from '@/theme';
import { useRevealOnFocus } from './revealOnFocus';
import { Text } from './Text';

interface Props extends Omit<TextInputProps, 'style' | 'selectionColor' | 'placeholderTextColor'> {
  label: string;
  /** Jednotka vpravo v poli (např. `kg`). */
  unit?: string;
  error?: string | null;
}

/**
 * Pole-pilulka (Nothing Dot §2.3): mono štítek nad polem, pole = pilulka `tile` s vlasovou hranou `edge`
 * (stejná plocha jako sekundární CTA). Fokus = hrana `text` v `stroke.focus`, chyba = hrana `danger` + věta pod polem.
 * Silná hrana leží jako vrstva přes vlasovou (mimo layout), takže se text při fokusu neposune.
 */
export function TextField({ label, unit, error, onFocus, onBlur, ...input }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  // Celý blok (štítek, pole, chyba), aby nad klávesnicí bylo vidět i chybové hlášení.
  const block = useRef<View>(null);
  const strongEdge = focused ? c.text : error ? c.danger : null;
  return (
    <View ref={block} style={{ gap: space.s }}>
      <Text variant="label" tone="muted">{label}</Text>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: size.pill, paddingHorizontal: space.l,
          backgroundColor: c.tile, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderStrong,
        }}
      >
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
        {unit ? <Text variant="telemetry" tone="muted">{unit}</Text> : null}
        {strongEdge ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: radius.full, borderWidth: stroke.focus, borderColor: strongEdge }]}
          />
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: c.danger }} accessibilityLiveRegion="polite">{error}</Text>
      ) : null}
    </View>
  );
}
