import { router } from 'expo-router';
import { View } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { PathCard } from '@/components/onboarding/PathCard';
import { copy } from '@/data/copy';
import { useOnboardingDraft, usePathOptions } from '@/hooks/useOnboardingDraft';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { PathId } from '@/types';

export default function PathStep() {
  const { space } = useTheme();
  const paths = usePathOptions();
  const path = useOnboardingDraft((s) => s.path);
  const milestones = useOnboardingDraft((s) => s.milestones);
  const set = useOnboardingDraft((s) => s.set);

  const choose = (id: PathId) => {
    haptics.tick();
    if (id === path) return;
    // Předvolby milníků patří k cestě; vlastní milníky jsou nezávislé a zůstávají.
    set({ path: id, milestones: milestones.filter((m) => m.custom) });
  };

  return (
    <OnboardingFrame
      step={1}
      title={copy.onboarding.path.title}
      lead={copy.onboarding.path.lead}
      canContinue={path !== null}
      onContinue={() => router.push('/onboarding/dream')}
    >
      <View accessibilityRole="radiogroup" style={{ gap: space.s }}>
        {paths.map((p) => <PathCard key={p.id} path={p} selected={p.id === path} onPress={() => choose(p.id)} />)}
      </View>
    </OnboardingFrame>
  );
}
