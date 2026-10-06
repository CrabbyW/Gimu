import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { CustomDreamField } from '@/components/onboarding/CustomDreamField';
import { DreamGlyph } from '@/components/onboarding/DreamGlyph';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Reveal } from '@/components/ui/choreo';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { stagger } from '@/lib/motion';
import { useSfx } from '@/lib/sound';
import { isDreamPreset, useDreamOptions, useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { isDreamValid } from '@/logic/onboarding';
import { useTheme } from '@/theme';

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
          <Reveal key={o.id} play delay={stagger(i + 2)}>
            <ChoiceCard
              title={o.title}
              line={o.line}
              selected={o.id === selectedId}
              onPress={() => { feedback(); setCustom(false); set({ dreamBody: o.sentence }); }}
              renderGlyph={(color, bg) => <DreamGlyph glyph={o.glyph} color={color} bg={bg} size={glyph} />}
            />
          </Reveal>
        ))}
        <Reveal play delay={stagger(options.length + 2)}>
          <ChoiceCard
            title={t.customTitle}
            line={t.customLine}
            selected={custom}
            onPress={() => { feedback(); if (!custom) { setCustom(true); if (isDreamPreset(dreamBody)) set({ dreamBody: '' }); } }}
            renderGlyph={(color, bg) => <DreamGlyph glyph="custom" color={color} bg={bg} size={glyph} />}
          />
        </Reveal>
        {custom ? (
          <Reveal play rise={8}>
            <CustomDreamField value={dreamBody} onChange={(dreamBody) => set({ dreamBody })} />
          </Reveal>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}
