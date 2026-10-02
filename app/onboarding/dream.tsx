import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { DreamGlyph } from '@/components/onboarding/DreamGlyph';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { useRevealOnFocus } from '@/components/ui/revealOnFocus';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { enterRise } from '@/lib/motion';
import { useSfx } from '@/lib/sound';
import { isDreamPreset, useDreamOptions, useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { DREAM_MAX_LENGTH, isDreamValid } from '@/logic/onboarding';
import { typography, useTheme } from '@/theme';

const t = copy.onboarding.dream;

/** Krok 2 (R36): šest vizí podle cesty + „Vlastní…“, které odkryje textové pole. Vybraná je právě jedna. */
export default function DreamStep() {
  const { space, size } = useTheme();
  const path = useOnboardingDraft((s) => s.path);
  const dreamBody = useOnboardingDraft((s) => s.dreamBody);
  const set = useOnboardingDraft((s) => s.set);
  const options = useDreamOptions(path);
  // Při návratu na krok se vlastní režim obnoví z uloženého textu, který neodpovídá žádné kartě (R41: karta = věta).
  const [custom, setCustom] = useState(() => dreamBody !== '' && !options.some((o) => o.sentence === dreamBody));
  const selectedId = custom ? null : options.find((o) => o.sentence === dreamBody)?.id ?? null;
  const glyph = size.choiceGlyph;
  const selectSound = useSfx('select');
  // R40: výběr vize = haptics.tick (jako krok 1) + tichý klik.
  const feedback = () => { haptics.tick(); selectSound(); };

  return (
    <OnboardingFrame
      step={2}
      title={t.title}
      lead={t.lead}
      canContinue={isDreamValid(dreamBody)}
      onContinue={() => router.push('/onboarding/milestones')}
    >
      <View accessibilityRole="radiogroup" style={{ gap: space.s }}>
        {options.map((o, i) => (
          <Animated.View key={o.id} entering={enterRise(i)}>
            <ChoiceCard
              title={o.title}
              line={o.line}
              selected={o.id === selectedId}
              onPress={() => { feedback(); setCustom(false); set({ dreamBody: o.sentence }); }}
              renderGlyph={(color, bg) => <DreamGlyph glyph={o.glyph} color={color} bg={bg} size={glyph} />}
            />
          </Animated.View>
        ))}
        <Animated.View entering={enterRise(options.length)}>
          <ChoiceCard
            title={t.customTitle}
            line={t.customLine}
            selected={custom}
            onPress={() => { feedback(); if (!custom) { setCustom(true); if (isDreamPreset(dreamBody)) set({ dreamBody: '' }); } }}
            renderGlyph={(color, bg) => <DreamGlyph glyph="custom" color={color} bg={bg} size={glyph} />}
          />
        </Animated.View>
        {custom ? (
          <Animated.View entering={enterRise(0, 8)}>
            <CustomDream value={dreamBody} onChange={(dreamBody) => set({ dreamBody })} />
          </Animated.View>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}

/** Pole vlastní vize: jediná spodní linka (jazyk TextField), při fokusu zesílí v `text` (R42: bez akcentu). */
function CustomDream({ value, onChange }: { value: string; onChange(v: string): void }) {
  const { c, space, stroke } = useTheme();
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  const block = useRef<View>(null);
  return (
    <View ref={block} style={{ gap: space.s, marginTop: space.m }}>
      <View style={{ borderBottomWidth: focused ? stroke.focus : 1, marginBottom: focused ? 0 : stroke.focus - 1, borderBottomColor: focused ? c.text : c.rule }}>
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
