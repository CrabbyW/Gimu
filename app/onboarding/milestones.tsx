import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { CustomMilestoneForm } from '@/components/onboarding/CustomMilestoneForm';
import { MilestoneChip } from '@/components/onboarding/MilestoneChip';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useMilestonePresets, useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { enterRise } from '@/lib/motion';
import { MILESTONES_MAX, MILESTONES_MIN, toggleMilestone } from '@/logic/onboarding';
import { useTheme } from '@/theme';
import type { Milestone } from '@/types';

const t = copy.onboarding.milestones;
const LIMIT_FLASH_MS = 1200;

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
        {/* R42: limit se zvýrazní kontrastem (muted → text), ne akcentem. */}
        <Text variant="telemetry" tone={limitHit > 0 ? 'text' : 'muted'} accessibilityLiveRegion="polite">
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
        <CustomMilestoneForm
          disabled={full}
          onAdd={(m) => set({ customMilestones: [...customs, m], milestones: [...selected, m] })}
        />
      </View>
    </OnboardingFrame>
  );
}
