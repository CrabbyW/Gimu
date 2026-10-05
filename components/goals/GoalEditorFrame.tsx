import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Reveal } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useGoals } from '@/hooks/useGoals';
import type { GoalsPatch } from '@/logic/goals';
import { intro, motion } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { UserProfile } from '@/types';

type Save = ReturnType<typeof useGoals>['save'];

/** Načte profil pro editor cíle: načítání = DotLoader, chyba / chybějící profil = ErrorState s cestou zpět. */
export function GoalEditorGate({ render }: { render(profile: UserProfile, save: Save): ReactNode }) {
  const { profile, save } = useGoals();
  if (profile.status === 'loading') return <DotLoaderScreen />;
  if (profile.status === 'error') return <ErrorState message={copy.goals.loadError} onRetry={profile.retry} />;
  if (!profile.data) return <ErrorState message={copy.goals.noProfile} actionLabel={copy.common.back} onRetry={() => router.back()} />;
  return <>{render(profile.data, save)}</>;
}

/** Odeslání změny: chyba validace / úložiště se vrátí jako česká věta (inline, ne Alert), úspěch = zpět do Nastavení.
 *  Dvojité ťuknutí na Uložit pošle jen jeden zápis. */
export function useGoalSubmit(save: Save) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const submit = useCallback(async (patch: GoalsPatch) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const result = await save(patch);
    inFlight.current = false;
    setBusy(false);
    if (result === null) router.back();
    else setError(copy.goals.errors[result]);
  }, [save]);
  const clearError = useCallback(() => setError(null), []);
  return { busy, error, submit, clearError };
}

interface Props {
  title: string;
  lead: string;
  /** Je co uložit (změna proti profilu a vyplněná pole). */
  canSave: boolean;
  busy: boolean;
  /** Chyba uložení; sedí těsně nad lištou, kde je uživatel palcem. */
  error: string | null;
  onSave(): void;
  children: ReactNode;
}

/** Rám editoru cíle (Teplá litina): mono kicker „Cíle“ + křížek, display titulek, lead `muted`,
 *  obsah a spodní lišta Zrušit / Uložit. Uložit je jediné plné CTA obrazovky. */
const G = intro.goals;

export function GoalEditorFrame({ title, lead, canSave, busy, error, onSave, children }: Props) {
  const { c, space, size, stroke } = useTheme();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.base }}>
      <Screen edges={['top']} scroll>
        {/* Motion (polish 2026-10-05): kicker → titulek+lead → obsah po `intro.goals.step`, 480 ms ease.out, bez pružiny.
            Hraje při každém otevření editoru (modal se mountuje znovu). Lišta Zrušit/Uložit stojí. */}
        <Reveal play delay={G.at} rise={G.rise} config={motion.reveal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.hitLarge }}>
          <Text variant="label" tone="muted">{copy.goals.section}</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={copy.goals.close}
            style={{ width: size.hit, height: size.hit, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
          </Pressable>
        </Reveal>
        <Reveal play delay={G.at + G.step} rise={G.rise} config={motion.reveal} style={{ marginTop: space.l, gap: space.s }}>
          <Text variant="display" accessibilityRole="header">{title}</Text>
          <Text tone="muted">{lead}</Text>
        </Reveal>
        <Reveal play delay={G.at + G.step * 2} rise={G.rise} config={motion.reveal} style={{ marginTop: space.xl }}>{children}</Reveal>
      </Screen>
      {error ? (
        <View style={{ paddingHorizontal: space.l, paddingVertical: space.m }}>
          <Text variant="caption" style={{ color: c.danger }} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text>
        </View>
      ) : null}
      <BigActionBar
        primary={{ label: copy.goals.save, onPress: onSave, disabled: !canSave || busy }}
        secondary={{ label: copy.goals.cancel, onPress: () => router.back() }}
      />
    </KeyboardAvoidingView>
  );
}
