import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { weightFieldErrors, type WeightError, type WeightKind } from '@/logic/onboarding';
import { useTheme } from '@/theme';

const t = copy.onboarding.weight;
const KIND_OPTIONS: readonly SegmentOption<WeightKind>[] = [
  { value: 'lose', label: t.lose },
  { value: 'gain', label: t.gain },
  { value: 'none', label: t.none },
];

type FieldErrors = { current: WeightError | null; target: WeightError | null };
const NO_ERRORS: FieldErrors = { current: null, target: null };

export default function WeightStep() {
  const { space } = useTheme();
  const kind = useOnboardingDraft((s) => s.weightKind);
  const currentKg = useOnboardingDraft((s) => s.currentKg);
  const targetKg = useOnboardingDraft((s) => s.targetKg);
  const set = useOnboardingDraft((s) => s.set);
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);

  const validate = (requireFilled: boolean): FieldErrors =>
    (kind === 'none' ? NO_ERRORS : weightFieldErrors(kind, currentKg, targetKg, requireFilled));

  const changeKind = (next: WeightKind) => {
    set({ weightKind: next });
    // Stará chyba patří k předchozímu směru; nově se ověří při opuštění pole nebo pokračování.
    setErrors(NO_ERRORS);
  };

  const onContinue = () => {
    const next = validate(true);
    setErrors(next);
    if (next.current === null && next.target === null) router.push('/onboarding/birth');
  };

  const bothFilled = currentKg.trim() !== '' && targetKg.trim() !== '';
  return (
    <OnboardingFrame
      step={4}
      title={t.title}
      lead={t.lead}
      canContinue={kind === 'none' || bothFilled}
      onContinue={onContinue}
    >
      <View style={{ gap: space.xl }}>
        <SegmentedControl<WeightKind> options={KIND_OPTIONS} value={kind} onChange={changeKind} />
        {kind !== 'none' ? (
          <View style={{ gap: space.l }}>
            <TextField
              label={t.current}
              unit={t.unit}
              value={currentKg}
              onChangeText={(v) => { set({ currentKg: v }); setErrors((e) => ({ ...e, current: null })); }}
              onBlur={() => setErrors(validate(false))}
              keyboardType="decimal-pad"
              maxLength={5}
              error={errors.current ? t.errors[errors.current] : null}
            />
            <TextField
              label={t.target}
              unit={t.unit}
              value={targetKg}
              onChangeText={(v) => { set({ targetKg: v }); setErrors((e) => ({ ...e, target: null })); }}
              onBlur={() => setErrors(validate(false))}
              keyboardType="decimal-pad"
              maxLength={5}
              error={errors.target ? t.errors[errors.target] : null}
            />
          </View>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}
