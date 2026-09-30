import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { DotSteps } from '@/components/ui/DotSteps';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { enterRise } from '@/lib/motion';
import { useTheme } from '@/theme';

const TOTAL_STEPS = 5;

interface Props {
  /** Číslo kroku 1–5. */
  step: number;
  title: string;
  lead: string;
  canContinue: boolean;
  onContinue(): void;
  children: ReactNode;
}

/** Rám kroku onboardingu: ukazatel kroků, titulek vlevo, obsah a spodní lišta Zpět / Pokračovat. */
export function OnboardingFrame({ step, title, lead, canContinue, onContinue, children }: Props) {
  const { c, space } = useTheme();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.base }}>
      <Screen edges={['top']} scroll>
        <View style={{ paddingTop: space.l, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="label" tone="muted">{copy.onboarding.stepLabel(step, TOTAL_STEPS)}</Text>
          <DotSteps total={TOTAL_STEPS} current={step - 1} />
        </View>
        {/* Nástup kroku (UX2): titulek, pak lead, pak obsah (ten si řadí vlastní sled). */}
        <View style={{ marginTop: space.xl, gap: space.s }}>
          <Animated.View entering={enterRise(0, 16)}><Text variant="display" accessibilityRole="header">{title}</Text></Animated.View>
          <Animated.View entering={enterRise(1)}><Text tone="muted">{lead}</Text></Animated.View>
        </View>
        <View style={{ marginTop: space.xl }}>{children}</View>
      </Screen>
      <BigActionBar
        primary={{ label: copy.common.continue, onPress: onContinue, disabled: !canContinue }}
        secondary={step > 1 ? { label: copy.common.back, onPress: () => router.back() } : undefined}
      />
    </KeyboardAvoidingView>
  );
}
