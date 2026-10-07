import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntentScrollView } from '@/components/dots';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Reveal } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useFinishSetup } from '@/hooks/useGoals';
import { useProfile } from '@/hooks/useProfile';
import { useSettingsPrefs } from '@/hooks/useSettingsPrefs';
import { intro } from '@/lib/motion';
import { useTheme } from '@/theme';
import { feedback } from '@/lib/feedback';

const t = copy.setup;
type Route = '/goals/dream' | '/goals/milestones' | '/goals/weight' | '/settings';

/**
 * Finish setup (elite fáze 1): krátký onboarding vynechal cíle, tady je uživatel doplní. Čtyři číslované řádky
 * v jedné dlaždici (mono „01“, název `bodyStrong`, aktuální výchozí hodnota `caption muted`, chevron) → existující
 * editory `app/goals/*` a připomínka v Nastavení. Jediné plné CTA = [DONE] → `completeSetup()`, dlaždice na mapě zmizí.
 * Hodnoty už jsou vyplněné výchozími, takže Done jde vždy (nic se nevynucuje).
 */
export default function SetupScreen() {
  const { c, space } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const prefs = useSettingsPrefs();
  const { complete } = useFinishSetup();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  if (profile.status === 'loading') return <DotLoaderScreen />;
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  const p = profile.data;
  if (!p) return <ErrorState message={copy.goals.noProfile} actionLabel={copy.common.back} onRetry={() => router.back()} />;

  const done = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    const ok = await complete();
    inFlight.current = false;
    setBusy(false);
    if (ok) { feedback('setupDone'); router.back(); } else setFailed(true);
  };

  const w = p.weightGoal;
  const rows: { title: string; value: string; route: Route }[] = [
    { title: t.rows.dream, value: p.dreamBody, route: '/goals/dream' },
    { title: t.rows.milestones, value: p.milestones.map((m) => m.label).join(' · '), route: '/goals/milestones' },
    { title: t.rows.weight, value: w.kind === 'none' ? copy.goals.weightNone : copy.goals.weightValue(w.kind, w.startKg, w.targetKg), route: '/goals/weight' },
    { title: t.rows.reminder, value: prefs.enabled ? copy.settings.hourValue(prefs.hour) : t.reminderOff, route: '/settings' },
  ];
  const M = intro.modal;

  return (
    <ReactiveBackground>
      <ScreenHeader intro title={t.title} status={{ left: t.kicker, right: t.steps(rows.length) }} actions={[{ icon: X, label: copy.common.back, onPress: () => router.back() }]} />
      <IntentScrollView
        contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: insets.bottom + space.xl, gap: space.l }}
        showsVerticalScrollIndicator={false}
      >
        <Reveal play delay={M.at} rise={M.rise}><Text tone="muted">{t.lead}</Text></Reveal>
        <Reveal play delay={M.at + M.step} rise={M.rise}>
          <Tile pad="none">
            {rows.map((r, i) => <StepRow key={r.route} n={i + 1} {...r} last={i === rows.length - 1} />)}
          </Tile>
        </Reveal>
        {failed ? <Text variant="bodyStrong" accessibilityRole="alert" style={{ color: c.danger }}>{t.saveError}</Text> : null}
      </IntentScrollView>
      <BigActionBar primary={{ label: t.done, onPress: () => { void done(); }, disabled: busy }} />
    </ReactiveBackground>
  );
}

/** Číslovaný krok: celá šířka je dotyková (min. `hitLarge`), stisk = `tilePressed`. */
function StepRow({ n, title, value, route, last }: { n: number; title: string; value: string; route: Route; last: boolean }) {
  const { c, space, size, stroke } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(route)}
      accessibilityRole="button"
      accessibilityLabel={copy.goals.rowA11y(title, value)}
      style={({ pressed }) => ({
        minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', gap: space.m,
        paddingHorizontal: size.tilePad, paddingVertical: space.m,
        backgroundColor: pressed ? c.tilePressed : 'transparent',
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule,
      })}
    >
      <Text variant="label" tone="muted">{String(n).padStart(2, '0')}</Text>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>{value}</Text>
      </View>
      <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
    </Pressable>
  );
}
