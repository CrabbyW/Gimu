import { useState } from 'react';
import { View } from 'react-native';
import { GoalEditorFrame, GoalEditorGate, useGoalSubmit } from '@/components/goals/GoalEditorFrame';
import { ChoiceCard } from '@/components/onboarding/ChoiceCard';
import { CustomDreamField } from '@/components/onboarding/CustomDreamField';
import { DreamGlyph } from '@/components/onboarding/DreamGlyph';
import { copy } from '@/data/copy';
import { useGoals } from '@/hooks/useGoals';
import { isDreamPreset, useDreamOptions } from '@/hooks/useOnboardingDraft';
import { haptics } from '@/lib/haptics';
import { isDreamValid } from '@/logic/onboarding';
import { useTheme } from '@/theme';
import type { UserProfile } from '@/types';

const t = copy.goals.dream;
const td = copy.onboarding.dream;

export default function DreamGoalScreen() {
  return <GoalEditorGate render={(profile, save) => <DreamEditor profile={profile} save={save} />} />;
}

/** Vize těla: karty vize aktuální cesty + „Vlastní…“ (stejné jako onboarding krok 2). Vybraná je právě jedna. */
function DreamEditor({ profile, save }: { profile: UserProfile; save: ReturnType<typeof useGoals>['save'] }) {
  const { space, size } = useTheme();
  const options = useDreamOptions(profile.path);
  const [body, setBody] = useState(profile.dreamBody);
  // Uložená vize, která neodpovídá žádné kartě cesty, se otevře jako vlastní text.
  const [custom, setCustom] = useState(() => !options.some((o) => o.sentence === profile.dreamBody));
  const { busy, error, submit, clearError } = useGoalSubmit(save);
  const selectedId = custom ? null : options.find((o) => o.sentence === body)?.id ?? null;
  const glyph = size.choiceGlyph;
  const trimmed = body.trim();
  const pick = (next: string) => { haptics.tick(); clearError(); setBody(next); };

  return (
    <GoalEditorFrame
      title={t.title}
      lead={t.lead}
      canSave={isDreamValid(trimmed) && trimmed !== profile.dreamBody}
      busy={busy}
      error={error}
      onSave={() => void submit({ dreamBody: trimmed })}
    >
      <View accessibilityRole="radiogroup" style={{ gap: space.s }}>
        {options.map((o) => (
          <ChoiceCard
            key={o.id}
            title={o.title}
            line={o.line}
            selected={o.id === selectedId}
            onPress={() => { setCustom(false); pick(o.sentence); }}
            renderGlyph={(color, bg) => <DreamGlyph glyph={o.glyph} color={color} bg={bg} size={glyph} />}
          />
        ))}
        <ChoiceCard
          title={td.customTitle}
          line={td.customLine}
          selected={custom}
          onPress={() => { if (custom) return; setCustom(true); pick(isDreamPreset(body) ? '' : body); }}
          renderGlyph={(color, bg) => <DreamGlyph glyph="custom" color={color} bg={bg} size={glyph} />}
        />
        {custom ? <CustomDreamField value={body} onChange={(v) => { clearError(); setBody(v); }} /> : null}
      </View>
    </GoalEditorFrame>
  );
}
