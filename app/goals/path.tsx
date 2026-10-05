import { useState } from 'react';
import { View } from 'react-native';
import { GoalEditorFrame, GoalEditorGate, useGoalSubmit } from '@/components/goals/GoalEditorFrame';
import { PathCard } from '@/components/onboarding/PathCard';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useGoals } from '@/hooks/useGoals';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { PathId, UserProfile } from '@/types';

const t = copy.goals.path;

export default function PathGoalScreen() {
  return <GoalEditorGate render={(profile, save) => <PathEditor profile={profile} save={save} />} />;
}

/** Cesta: tři PathCard z onboardingu. Upozornění na přepnutí mapy se ukáže, až když je vybraná jiná cesta. */
function PathEditor({ profile, save }: { profile: UserProfile; save: ReturnType<typeof useGoals>['save'] }) {
  const { c, space, stroke } = useTheme();
  const paths = usePathOptions();
  const [selected, setSelected] = useState<PathId>(profile.path);
  const { busy, error, submit, clearError } = useGoalSubmit(save);
  const changed = selected !== profile.path;

  return (
    <GoalEditorFrame
      title={t.title}
      lead={t.lead}
      canSave={changed}
      busy={busy}
      error={error}
      onSave={() => void submit({ path: selected })}
    >
      <View accessibilityRole="radiogroup" style={{ gap: space.s }}>
        {paths.map((p) => (
          <PathCard key={p.id} path={p} selected={p.id === selected} onPress={() => { haptics.tick(); clearError(); setSelected(p.id); }} />
        ))}
      </View>
      {changed ? (
        // Důsledek změny: věta s proužkem `text` vlevo (stejná gramatika jako vybraná karta), ne akcent ani varovná barva.
        <View style={{ marginTop: space.l, paddingLeft: space.m, borderLeftWidth: stroke.focus, borderLeftColor: c.text }}>
          <Text variant="bodyStrong" accessibilityLiveRegion="polite">{t.notice}</Text>
        </View>
      ) : null}
    </GoalEditorFrame>
  );
}
