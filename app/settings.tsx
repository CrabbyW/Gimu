import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { Reveal } from '@/components/ui/choreo';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { Toggle } from '@/components/ui/Toggle';
import { ValueWheelSheet } from '@/components/ui/ValueWheelSheet';
import { copy, keepUnits } from '@/data/copy';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { REMINDER_HOURS, useSettingsPrefs, type ThemePreference } from '@/hooks/useSettingsPrefs';
import { haptics } from '@/lib/haptics';
import { poseForAppState } from '@/logic/mascotPoses';
import { intro, motion } from '@/lib/motion';
import { services } from '@/services';
import { useDevControls } from '@/hooks/useDevControls';
import { opacity, useTheme } from '@/theme';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';
import { IntentScrollView } from '@/components/dots';

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const HOURS = REMINDER_HOURS;

/** Nastavení (Nothing Dot): Doto titulek a kulatý křížek (ScreenHeader), pod ním sekce s mono štítkem.
 *  Řádky jedné sekce leží v jedné dlaždici a dělí je jen vlasová linka `rule` (jediná technika oddělení).
 *  Vzhled je pilulkový SegmentedControl bez dlaždice (pilulka je sama plocha). Připomínka: Toggle + čas přes
 *  ValueWheelSheet + test; při `denied` vysvětlení a cesta do systému, na webu jen věta, že notifikace nejdou. */
const NO_COSMETICS = {} as const;

export default function SettingsScreen() {
  const { c, space, size, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  const prefs = useSettingsPrefs();
  const [wheelOpen, setWheelOpen] = useState(false);
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { hapticsEnabled, setHapticsEnabled, soundEnabled, setSoundEnabled } = prefs;
  // Modal je nová scéna: nástup sekcí se hraje při každém otevření.
  const first = true;

  const web = Platform.OS === 'web';
  const denied = !web && prefs.permission === 'denied';
  const blocked = web || denied;
  const on = prefs.enabled && !blocked;
  const testDisabled = blocked || prefs.permission !== 'granted' || busy;

  const sendTest = async () => {
    if (busy) return;
    setBusy(true); setNote(null);
    try { await prefs.sendTest(copy.notifications.reminder(stats?.streak ?? 0)); setNote(copy.settings.sent); } catch { setNote(copy.wardrobe.actionError); } finally { setBusy(false); }
  };

  const { resetDev } = useDevControls();
  const confirmReset = () => {
    const run = async () => { await services.user.reset(); resetDev(); router.dismissAll(); router.replace('/'); };
    // RN Web `Alert` nic nezobrazí, proto na webu `confirm` (jako v dev menu a lekci).
    if (Platform.OS === 'web') { if (globalThis.confirm(copy.settings.resetConfirm)) void run(); return; }
    Alert.alert(copy.settings.resetTitle, copy.settings.resetConfirm, [
      { text: copy.settings.resetCancel, style: 'cancel' },
      { text: copy.settings.resetDo, style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
      <ScreenHeader intro={first} title={copy.settings.title} actions={[{ icon: X, label: copy.common.back, onPress: () => router.back() }]} />
      <IntentScrollView
        contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: insets.bottom + space.xxl, gap: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cíle nahoře: to jediné tady mění trénink, ostatní je vzhled a odezva. */}
        <Section i={0} play={first}>
          <GoalsSection profile={profile} play={first} />
        </Section>

        {/* Úroveň (elite fáze 5): opakovaný vstupní test a disclaimer. Patří k tréninku, proto hned pod Cíle. */}
        <Section i={1} play={first} label={copy.fitness.safetySection}>
          <Tile pad="none">
            <PressRow onPress={() => router.push('/fitness-test')} accessibilityLabel={copy.fitness.retest}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="bodyStrong">{copy.fitness.retest}</Text>
                <Text variant="caption" tone="muted">
                  {profile.status === 'ready' && profile.data?.fitnessTest
                    ? copy.fitness.rowValue(profile.data.fitnessTest.pushups, profile.data.fitnessTest.plankS)
                    : copy.fitness.rowNone}
                </Text>
                <Text variant="caption" tone="muted">{copy.fitness.retestHint}</Text>
              </View>
              <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
            </PressRow>
            <TileRow last>
              <Text variant="caption" tone="muted">{copy.fitness.disclaimer}</Text>
            </TileRow>
          </Tile>
        </Section>

        <Section i={2} play={first} label={copy.settings.appearance}>
          <SegmentedControl
            options={THEMES.map((t) => ({ value: t, label: copy.settings.themeOptions[t] }))}
            value={prefs.theme}
            onChange={(t) => { haptics.tick(); prefs.setTheme(t); }}
          />
        </Section>

        <Section i={3} play={first} label={copy.settings.reminderSection}>
          <Tile pad="none">
            <TileRow>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.settings.reminder}</Text>
                <Toggle value={on} disabled={blocked} label={copy.settings.reminder} onChange={(v) => { haptics.tick(); void prefs.setEnabled(v); }} />
              </View>
              {web ? <Text variant="caption" tone="muted">{copy.settings.unsupported}</Text> : null}
              {denied ? (
                <View style={{ gap: space.m }}>
                  <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">{copy.settings.denied}</Text>
                  <PillButton label={copy.settings.openSettings} variant="secondary" onPress={prefs.openSystemSettings} />
                </View>
              ) : null}
            </TileRow>
            {/* Čas připomínky: řádek → ValueWheelSheet (stejný výběr jako v onboardingu). */}
            <PressRow
              onPress={() => setWheelOpen(true)}
              disabled={!on}
              accessibilityLabel={`${copy.settings.hourPick} ${copy.settings.hourValue(prefs.hour)}`}
            >
              <Text variant="body" style={{ flex: 1 }}>{copy.settings.hourPick}</Text>
              <Text variant="stat">{copy.settings.hourValue(prefs.hour)}</Text>
              <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
            </PressRow>
            <PressRow last onPress={() => void sendTest()} disabled={testDisabled} accessibilityLabel={copy.settings.sendTest}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="body">{copy.settings.sendTest}</Text>
                {note ? <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}
              </View>
              <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
            </PressRow>
          </Tile>
          <ValueWheelSheet
            visible={wheelOpen}
            title={copy.settings.hourPick}
            options={HOURS.map((h) => ({ key: String(h), label: copy.settings.hourValue(h) }))}
            selectedIndex={HOURS.indexOf(prefs.hour)}
            onSave={(i) => { const h = HOURS[i]; if (h !== undefined) void prefs.setHour(h); setWheelOpen(false); }}
            onClose={() => setWheelOpen(false)}
          />
        </Section>

        {/* Motion spec §6.2: haptika a zvuk jsou dva nezávislé přepínače. */}
        <Section i={4} play={first} label={copy.settings.feedback}>
          <Tile pad="none">
            <TileRow>
              <SwitchRow title={copy.settings.haptics} line={copy.settings.hapticsLine} value={hapticsEnabled} onChange={setHapticsEnabled} />
            </TileRow>
            <TileRow last>
              <SwitchRow title={copy.settings.sound} line={copy.settings.soundLine} value={soundEnabled} onChange={setSoundEnabled} />
            </TileRow>
          </Tile>
        </Section>

        {/* Reset: smaže profil, pokrok a historii; appka začne znovu onboardingem (téma zůstane). */}
        <Section i={5} play={first} label={copy.settings.dataSection}>
          <Tile pad="none">
            <PressRow last onPress={confirmReset} accessibilityLabel={copy.settings.reset}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="bodyStrong" style={{ color: c.danger }}>{copy.settings.reset}</Text>
                <Text variant="caption" tone="muted">{copy.settings.resetLine}</Text>
              </View>
            </PressRow>
          </Tile>
        </Section>

        {__DEV__ ? (
          <Section i={6} play={first}>
            <Tile pad="none">
              <PressRow last onPress={() => router.push('/dev')} accessibilityLabel={copy.settings.dev} role="link">
                <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.settings.dev}</Text>
                <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
              </PressRow>
            </Tile>
          </Section>
        ) : null}

        {/* Tichý podpis na konci (opice v2): opička ladí kolo, jediný barevný subjekt, pod obsahem, nic nepřebíjí. */}
        <Section i={7} play={first}>
          <View style={{ alignItems: 'center' }}>
            <Mascot stage={stats?.stage ?? 1} mood="idle" pose={poseForAppState('settings')} size={size.heroMascot} cosmetics={NO_COSMETICS} decorative hop={false} />
          </View>
        </Section>
      </IntentScrollView>
    </ReactiveBackground>
  );
}

type GoalRoute = '/goals/milestones' | '/goals/weight' | '/goals/dream' | '/goals/path';
const tg = copy.goals;

/** Sekce Cíle: čtyři řádky v jedné dlaždici (název `bodyStrong`, aktuální hodnota `caption muted`, chevron) → editory
 *  v `app/goals/*`. Načítání = hodnoty „Načítám“, chyba = věta + [ZKUSIT ZNOVU] (zbytek Nastavení funguje dál). */
function GoalsSection({ profile, play }: { profile: ReturnType<typeof useProfile>; play: boolean }) {
  const { space } = useTheme();
  const paths = usePathOptions();
  if (profile.status === 'error') {
    return (
      <View style={{ gap: space.m }}>
        <SectionLabel>{tg.section}</SectionLabel>
        <Tile style={{ gap: space.m }}>
          <Text variant="body" accessibilityRole="alert">{tg.loadError}</Text>
          <PillButton label={copy.common.retry} variant="secondary" onPress={profile.retry} />
        </Tile>
      </View>
    );
  }
  const p = profile.status === 'ready' ? profile.data : null;
  const loading = profile.status === 'loading';
  const value = (v: string | undefined) => (loading ? copy.common.loading : v ?? '');
  const w = p?.weightGoal;
  // Motion (polish 2026-10-05): řádky po `intro.goalRows.step` za nástupem sekce; hodnoty, které dorazí až po
  // načtení, se prolnou (klíč stavu → remount Reveal). Timing, žádná pružina: řádky jsou klikatelné.
  const rowAt = (k: number) => intro.modal.at + intro.goalRows.step * (k + 1);
  return (
    <View style={{ gap: space.m }}>
      <SectionLabel>{tg.section}</SectionLabel>
      <Tile pad="none">
        <GoalRow play={play} delay={rowAt(0)} loading={loading} title={tg.rows.milestones} route="/goals/milestones" disabled={!p}
          value={value(p ? keepUnits(p.milestones.map((m) => (m.custom ? copy.onboarding.milestones.customChip(m.label, m.target, m.unit) : m.label)).join(' · ')) : undefined)} />
        <GoalRow play={play} delay={rowAt(1)} loading={loading} title={tg.rows.weight} route="/goals/weight" disabled={!p}
          value={value(w ? (w.kind === 'none' ? tg.weightNone : tg.weightValue(w.kind, w.startKg, w.targetKg)) : undefined)} />
        <GoalRow play={play} delay={rowAt(2)} loading={loading} title={tg.rows.dream} route="/goals/dream" disabled={!p} value={value(p?.dreamBody)} />
        <GoalRow last play={play} delay={rowAt(3)} loading={loading} title={tg.rows.path} route="/goals/path" disabled={!p} value={value(paths.find((x) => x.id === p?.path)?.name)} />
      </Tile>
    </View>
  );
}

/** Řádek cíle: celá šířka dlaždice je dotyková (min. `hitLarge`), stisk = výplň `tilePressed`. */
function GoalRow({ title, value, route, disabled, play, delay, loading, last = false }: {
  title: string; value: string; route: GoalRoute; disabled: boolean; play: boolean; delay: number; loading: boolean; last?: boolean;
}) {
  const { c, space, size, stroke } = useTheme();
  const [loadingAtMount] = useState(loading);
  return (
    <Reveal play={play} delay={delay} rise={intro.modal.rise} config={motion.reveal}>
      <PressRow last={last} onPress={() => router.push(route)} disabled={disabled} dimWhenDisabled={false} accessibilityLabel={tg.rowA11y(title, value)}>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="bodyStrong">{title}</Text>
          <Reveal key={loading ? 'loading' : 'ready'} play={loadingAtMount && !loading} rise={0} config={motion.reveal}>
            <Text variant="caption" tone="muted" numberOfLines={2}>{value}</Text>
          </Reveal>
        </View>
        <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
      </PressRow>
    </Reveal>
  );
}

/** Mono štítek sekce nad dlaždicí (VERZÁLKY dodá varianta `telemetry`). */
function SectionLabel({ children }: { children: string }) {
  return <Text variant="telemetry" tone="muted" accessibilityRole="header">{children}</Text>;
}

/** Statický řádek v dlaždici: vnitřní okraj `tilePad`, pod ním vlasová linka `rule` (kromě posledního). */
function TileRow({ children, last = false }: { children: ReactNode; last?: boolean }) {
  const { c, space, size } = useTheme();
  return (
    <View style={{ paddingHorizontal: size.tilePad, paddingVertical: space.m, gap: space.s, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
      {children}
    </View>
  );
}

/** Klikatelný řádek v dlaždici (min. `hitLarge`), stisk = `tilePressed`. Zakázaný se ztlumí na `opacity.disabled`
 *  (kromě řádků cílů při načítání: text „Načítám“ tam stav nese sám). */
function PressRow({ children, onPress, disabled = false, dimWhenDisabled = true, last = false, accessibilityLabel, role = 'button' }: {
  children: ReactNode; onPress(): void; disabled?: boolean; dimWhenDisabled?: boolean; last?: boolean; accessibilityLabel: string; role?: 'button' | 'link';
}) {
  const { c, space, size } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', gap: space.m,
        paddingHorizontal: size.tilePad, paddingVertical: space.m,
        backgroundColor: pressed ? c.tilePressed : 'transparent',
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule,
        opacity: disabled && dimWhenDisabled ? opacity.disabled : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/** Řádek přepínače: název `bodyStrong`, pod ním věta `caption muted`, vpravo Toggle-pilulka. */
function SwitchRow({ title, line, value, onChange }: { title: string; line: string; value: boolean; onChange(v: boolean): void }) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m }}>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="muted">{line}</Text>
      </View>
      <Toggle value={value} label={title} onChange={(v) => { haptics.tick(); onChange(v); }} />
    </View>
  );
}

/** Sekce: mono štítek (volitelný) nad obsahem; nástup po `intro.modal.step`. */
function Section({ children, i, play, label }: { children: ReactNode; i: number; play: boolean; label?: string }) {
  const { space } = useTheme();
  const M = intro.modal;
  return (
    <Reveal play={play} delay={M.at + M.step * i} rise={M.rise} style={{ gap: space.m }}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      {children}
    </Reveal>
  );
}
