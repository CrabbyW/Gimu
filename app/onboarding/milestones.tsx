import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { MilestoneChip } from '@/components/onboarding/MilestoneChip';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Button } from '@/components/ui/Button';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useMilestonePresets, useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { now } from '@/lib/clock';
import { enterRise } from '@/lib/motion';
import {
  customMilestone, MILESTONES_MAX, MILESTONES_MIN, parseMilestoneTarget, toggleMilestone,
} from '@/logic/onboarding';
import { useTheme } from '@/theme';
import type { Milestone, MilestoneUnit } from '@/types';

const t = copy.onboarding.milestones;
const UNIT_OPTIONS: readonly SegmentOption<MilestoneUnit>[] = (['reps', 'seconds', 'kg', 'done'] as const)
  .map((value) => ({ value, label: t.units[value] }));
const LIMIT_FLASH_MS = 1200;
const CUSTOM_LABEL_MAX = 40;

export default function MilestonesStep() {
  const { space } = useTheme();
  const path = useOnboardingDraft((s) => s.path);
  const selected = useOnboardingDraft((s) => s.milestones);
  const customs = useOnboardingDraft((s) => s.customMilestones);
  const set = useOnboardingDraft((s) => s.set);
  const presets = useMilestonePresets(path);
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const [limitHit, setLimitHit] = useState(0);

  // Po odmítnutí 4. milníku počítadlo krátce zvýrazní limit.
  useEffect(() => {
    if (limitHit === 0) return;
    const timer = setTimeout(() => setLimitHit(0), LIMIT_FLASH_MS);
    return () => clearTimeout(timer);
  }, [limitHit]);

  const toggle = (m: Milestone) => {
    const result = toggleMilestone(selected, m);
    if (result.rejected) {
      setShakes((s) => ({ ...s, [m.id]: (s[m.id] ?? 0) + 1 }));
      setLimitHit((n) => n + 1);
      return;
    }
    set({ milestones: result.milestones });
  };

  const chips: Milestone[] = [
    ...presets.map((p) => ({ ...p, current: 0, custom: false })),
    ...customs,
  ];
  const isSelected = (id: string) => selected.some((m) => m.id === id);
  const full = selected.length >= MILESTONES_MAX;

  return (
    <OnboardingFrame
      step={3}
      title={t.title}
      lead={t.lead}
      canContinue={selected.length >= MILESTONES_MIN && selected.length <= MILESTONES_MAX}
      onContinue={() => router.push('/onboarding/weight')}
    >
      <View style={{ gap: space.m }}>
        <Text variant="label" tone={limitHit > 0 ? 'accent' : 'muted'} accessibilityLiveRegion="polite">
          {t.pickCount(selected.length, MILESTONES_MAX)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
          {chips.map((m, i) => (
            <Animated.View key={m.id} entering={enterRise(i, 8)}>
              <MilestoneChip
                label={m.custom ? t.customChip(m.label, m.target, m.unit) : m.label}
                selected={isSelected(m.id)}
                onPress={() => toggle(m)}
                shakeSignal={shakes[m.id] ?? 0}
              />
            </Animated.View>
          ))}
        </View>
        <CustomMilestone
          disabled={full}
          onAdd={(m) => set({ customMilestones: [...customs, m], milestones: [...selected, m] })}
        />
      </View>
    </OnboardingFrame>
  );
}

/** „+ Vlastní milník“: rozbalí inline formulář s názvem, jednotkou a cílem. */
function CustomMilestone({ disabled, onAdd }: { disabled: boolean; onAdd(m: Milestone): void }) {
  const { c, space, size } = useTheme();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [unit, setUnit] = useState<MilestoneUnit>('reps');
  const [target, setTarget] = useState('');
  const [targetError, setTargetError] = useState(false);

  const needsTarget = unit !== 'done';
  const parsedTarget = parseMilestoneTarget(target);
  const valid = label.trim().length > 0 && (!needsTarget || parsedTarget !== null);

  const close = () => { setOpen(false); setLabel(''); setUnit('reps'); setTarget(''); setTargetError(false); };
  const submit = () => {
    if (!valid || disabled) return;
    onAdd(customMilestone(label, parsedTarget ?? 1, unit, now().getTime()));
    close();
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t.addCustom}
        accessibilityState={{ disabled }}
        style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.s, alignSelf: 'flex-start', opacity: disabled ? 0.4 : 1 }}
      >
        <Plus color={c.text} size={20} strokeWidth={1.5} />
        <Text variant="bodyStrong">{t.addCustom}</Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={enterRise(0, 8)} style={{ gap: space.l, marginTop: space.m }}>
      <TextField label={t.customLabel} value={label} onChangeText={setLabel} placeholder={t.customPlaceholder} maxLength={CUSTOM_LABEL_MAX} autoFocus />
      <View style={{ gap: space.s }}>
        <Text variant="label" tone="muted">{t.customUnit}</Text>
        <SegmentedControl<MilestoneUnit> options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
      </View>
      {unit !== 'done' ? (
        <TextField
          label={t.customTarget}
          unit={t.unitShort[unit]}
          placeholder={t.targetPlaceholder[unit]}
          value={target}
          onChangeText={(v) => { setTarget(v); setTargetError(false); }}
          onBlur={() => setTargetError(target.trim() !== '' && parsedTarget === null)}
          keyboardType="number-pad"
          maxLength={4}
          error={targetError ? t.customTargetError : null}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <Button label={t.customSubmit} onPress={submit} variant="secondary" disabled={!valid || disabled} style={{ flex: 1 }} />
        <Button label={t.customCancel} onPress={close} variant="ghost" />
      </View>
    </Animated.View>
  );
}
