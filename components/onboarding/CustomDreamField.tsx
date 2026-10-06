import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRevealOnFocus } from '@/components/ui/revealOnFocus';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { DREAM_MAX_LENGTH } from '@/logic/onboarding';
import { typography, useTheme } from '@/theme';

const t = copy.onboarding.dream;

/** Pole vlastní vize: víceřádková dlaždice `tile` s vlasovou hranou (jazyk TextField, ale radius `tile`, ne pilulka,
 *  protože text se zalamuje). Fokus = hrana `text` ve `stroke.focus` jako vrstva, bez posunu obsahu.
 *  Sdílí onboarding (krok 2) a Nastavení → Cíle → Vize těla. */
export function CustomDreamField({ value, onChange }: { value: string; onChange(v: string): void }) {
  const { c, space, stroke, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  const block = useRef<View>(null);
  return (
    <View ref={block} style={{ gap: space.s, marginTop: space.m }}>
      <View style={{ paddingHorizontal: space.l, backgroundColor: c.tile, borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge }}>
        {focused ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: stroke.focus, borderColor: c.text }]} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          multiline
          autoFocus
          maxLength={DREAM_MAX_LENGTH}
          placeholder={t.placeholder}
          accessibilityLabel={t.customField}
          onFocus={() => { setFocused(true); reveal?.focus(block.current); }}
          onBlur={() => { setFocused(false); reveal?.blur(block.current); }}
          selectionColor={c.muted}
          cursorColor={c.text}
          placeholderTextColor={c.muted}
          textAlignVertical="top"
          style={{ ...typography.input, color: c.text, minHeight: typography.input.lineHeight * 2 + space.m * 2, paddingVertical: space.m }}
        />
      </View>
      <Text variant="telemetry" tone="muted" style={{ alignSelf: 'flex-end' }} accessibilityLabel={t.counterA11y(value.length, DREAM_MAX_LENGTH)}>
        {t.counter(value.length, DREAM_MAX_LENGTH)}
      </Text>
    </View>
  );
}
