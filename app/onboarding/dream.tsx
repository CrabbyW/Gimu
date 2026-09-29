import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { useRevealOnFocus } from '@/components/ui/revealOnFocus';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { DREAM_MAX_LENGTH, isDreamValid } from '@/logic/onboarding';
import { typography, useTheme } from '@/theme';

const t = copy.onboarding.dream;

export default function DreamStep() {
  const { c, space } = useTheme();
  const dreamBody = useOnboardingDraft((s) => s.dreamBody);
  const set = useOnboardingDraft((s) => s.set);
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  const block = useRef<View>(null);

  return (
    <OnboardingFrame
      step={2}
      title={t.title}
      lead={t.lead}
      canContinue={isDreamValid(dreamBody)}
      onContinue={() => router.push('/onboarding/milestones')}
    >
      <View ref={block} style={{ gap: space.s }}>
        {/* Stejný jazyk jako TextField: jediná spodní linka, při fokusu v akcentu. */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: focused ? c.accent : c.rule }}>
          <TextInput
            value={dreamBody}
            onChangeText={(dreamBody) => set({ dreamBody })}
            multiline
            maxLength={DREAM_MAX_LENGTH}
            placeholder={t.placeholder}
            accessibilityLabel={t.title}
            onFocus={() => { setFocused(true); reveal?.focus(block.current); }}
            onBlur={() => { setFocused(false); reveal?.blur(block.current); }}
            selectionColor={c.accent}
            cursorColor={c.accent}
            placeholderTextColor={c.muted}
            textAlignVertical="top"
            style={{ ...typography.body, fontSize: 22, lineHeight: 32, color: c.text, minHeight: 32 * 3 + space.m * 2, paddingVertical: space.m }}
          />
        </View>
        <Text variant="label" tone="muted" style={{ alignSelf: 'flex-end' }} accessibilityLabel={t.counterA11y(dreamBody.length, DREAM_MAX_LENGTH)}>
          {t.counter(dreamBody.length, DREAM_MAX_LENGTH)}
        </Text>
      </View>
    </OnboardingFrame>
  );
}
