import { useState } from 'react';
import { View } from 'react-native';
import { GoalEditorFrame, GoalEditorGate, useGoalSubmit } from '@/components/goals/GoalEditorFrame';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useGoals } from '@/hooks/useGoals';
import { parseWeight, weightFieldErrors, type WeightError, type WeightKind } from '@/logic/onboarding';
import { useTheme } from '@/theme';
import type { UserProfile } from '@/types';

const t = copy.goals.weight;
const tw = copy.onboarding.weight;
const KIND_OPTIONS: readonly SegmentOption<WeightKind>[] = [
  { value: 'lose', label: tw.lose },
  { value: 'gain', label: tw.gain },
  { value: 'none', label: tw.none },
];

type FieldErrors = { current: WeightError | null; target: WeightError | null };
const NO_ERRORS: FieldErrors = { current: null, target: null };

export default function WeightGoalScreen() {
  return <GoalEditorGate render={(profile, save) => <WeightEditor profile={profile} save={save} />} />;
}

/** Cíl váhy: směr (SegmentedControl) a dvě pole jako v onboardingu krok 4. Validace polí při opuštění a při Uložit. */
function WeightEditor({ profile, save }: { profile: UserProfile; save: ReturnType<typeof useGoals>['save'] }) {
  const { space } = useTheme();
  const g = profile.weightGoal;
  const initialStart = g.kind === 'none' ? '' : copy.goals.kg(g.startKg);
  const initialTarget = g.kind === 'none' ? '' : copy.goals.kg(g.targetKg);
  const [kind, setKind] = useState<WeightKind>(g.kind);
  const [startKg, setStartKg] = useState(initialStart);
  const [targetKg, setTargetKg] = useState(initialTarget);
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const { busy, error, submit, clearError } = useGoalSubmit(save);

  const validate = (requireFilled: boolean): FieldErrors =>
    (kind === 'none' ? NO_ERRORS : weightFieldErrors(kind, startKg, targetKg, requireFilled));

  const changed = kind !== g.kind || (kind !== 'none' && (startKg.trim() !== initialStart || targetKg.trim() !== initialTarget));
  const filled = kind === 'none' || (startKg.trim() !== '' && targetKg.trim() !== '');

  const onSave = () => {
    if (kind === 'none') { void submit({ weightGoal: { kind: 'none' } }); return; }
    const next = weightFieldErrors(kind, startKg, targetKg, true);
    setErrors(next);
    if (next.current !== null || next.target !== null) return;
    const start = parseWeight(startKg);
    const target = parseWeight(targetKg);
    if (start === null || target === null) return;
    void submit({ weightGoal: { kind, startKg: start, targetKg: target } });
  };

  return (
    <GoalEditorFrame title={t.title} lead={t.lead} canSave={changed && filled} busy={busy} error={error} onSave={onSave}>
      <View style={{ gap: space.xl }}>
        <SegmentedControl<WeightKind> options={KIND_OPTIONS} value={kind} onChange={(k) => { setKind(k); setErrors(NO_ERRORS); clearError(); }} />
        {kind !== 'none' ? (
          <View style={{ gap: space.l }}>
            <TextField
              label={t.start}
              unit={tw.unit}
              value={startKg}
              onChangeText={(v) => { setStartKg(v); setErrors((e) => ({ ...e, current: null })); clearError(); }}
              onBlur={() => setErrors(validate(false))}
              keyboardType="decimal-pad"
              maxLength={5}
              error={errors.current ? tw.errors[errors.current] : null}
            />
            <TextField
              label={tw.target}
              unit={tw.unit}
              value={targetKg}
              onChangeText={(v) => { setTargetKg(v); setErrors((e) => ({ ...e, target: null })); clearError(); }}
              onBlur={() => setErrors(validate(false))}
              keyboardType="decimal-pad"
              maxLength={5}
              error={errors.target ? tw.errors[errors.target] : null}
            />
          </View>
        ) : null}
      </View>
    </GoalEditorFrame>
  );
}
