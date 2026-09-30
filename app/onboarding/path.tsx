import { router } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { PathCard } from '@/components/onboarding/PathCard';
import { copy } from '@/data/copy';
import { isDreamPreset, useOnboardingDraft, usePathOptions } from '@/hooks/useOnboardingDraft';
import { haptics } from '@/lib/haptics';
import { enterRise } from '@/lib/motion';
import { useSfx } from '@/lib/sound';
import { useTheme } from '@/theme';
import type { PathId } from '@/types';

export default function PathStep() {
  const { space } = useTheme();
  const paths = usePathOptions();
  const path = useOnboardingDraft((s) => s.path);
  const milestones = useOnboardingDraft((s) => s.milestones);
  const dreamBody = useOnboardingDraft((s) => s.dreamBody);
  const set = useOnboardingDraft((s) => s.set);
  const selectSound = useSfx('select');

  const choose = (id: PathId) => {
    haptics.tick();
    selectSound();
    if (id === path) return;
    // Předvolby milníků i vize patří k cestě; vlastní milníky a vlastní text vize zůstávají.
    set({ path: id, milestones: milestones.filter((m) => m.custom), dreamBody: isDreamPreset(dreamBody) ? '' : dreamBody });
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
        {paths.map((p, i) => (
          <Animated.View key={p.id} entering={enterRise(i)}>
            <PathCard path={p} selected={p.id === path} onPress={() => choose(p.id)} />
          </Animated.View>
        ))}
      </View>
    </OnboardingFrame>
  );
}
