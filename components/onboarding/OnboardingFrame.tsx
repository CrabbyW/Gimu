import { router, useFocusEffect } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { DotRow } from '@/components/dots/DotRow';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Reveal } from '@/components/ui/choreo';
import { Screen } from '@/components/ui/Screen';
import { StatusLine } from '@/components/ui/StatusLine';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { stagger } from '@/lib/motion';
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

/** Rám kroku onboardingu (Nothing Dot): stavový řádek a tečky kroků, Doto titulek vlevo, lead `muted`,
 *  obsah o `space.l` níž a spodní pilulky [ZPĚT] / [POKRAČOVAT] (BigActionBar). */
export function OnboardingFrame({ step, title, lead, canContinue, onContinue, children }: Props) {
  const { c, space } = useTheme();
  // Boss oprava: rychlé dvojité/trojité ťuknutí na Pokračovat přeskakovalo krok (např. milníky → váha →
  // zrození bez zastavení na váze). Bez debounce na hodnotu: gate se otevře jen zaostřením/reostřením
  // obrazovky, ne časem, takže na stejném kroku projde vždy nejvýš jedno volání onContinue.
  const firedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      firedRef.current = false;
      return () => { firedRef.current = false; };
    }, []),
  );
  const guardedContinue = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onContinue();
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.base }}>
      <Screen edges={['top']} scroll>
        {/* Nothing Dot: stavový řádek „KROK … 01/05“ a pod ním 5 teček (rozsvícené = aktuální a hotové kroky). */}
        <View style={{ paddingTop: space.l, gap: space.s }}>
          <StatusLine
            left={copy.onboarding.stepKey}
            right={copy.onboarding.stepValue(step, TOTAL_STEPS)}
            rightA11y={copy.onboarding.stepA11y(step, TOTAL_STEPS)}
          />
          {/* Staticky stojí; motion-agent: rozsvícení nové tečky po dojetí přechodu `slide_from_right`. */}
          <DotRow total={TOTAL_STEPS} fraction={step / TOTAL_STEPS} intro={false} />
        </View>
        {/* Nástup kroku: titulek, pak lead (Reveal, ne layout `entering`: ten na webu nechával obal
            `position: absolute`, lead pak ležel přes 1. kartu a mezi kartami zůstávala díra). */}
        <View style={{ marginTop: space.xxl, gap: space.s }}>
          <Reveal play rise={16}><Text variant="display" accessibilityRole="header">{title}</Text></Reveal>
          <Reveal play delay={stagger(1)}><Text tone="muted">{lead}</Text></Reveal>
        </View>
        <View style={{ marginTop: space.l }}>{children}</View>
      </Screen>
      <BigActionBar
        primary={{ label: copy.common.continue, onPress: guardedContinue, disabled: !canContinue }}
        secondary={step > 1 ? { label: copy.common.back, onPress: () => router.back() } : undefined}
      />
    </KeyboardAvoidingView>
  );
}
