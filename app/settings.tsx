import { router } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/choreo';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { ValueWheelSheet } from '@/components/ui/ValueWheelSheet';
import { copy } from '@/data/copy';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { REMINDER_HOURS, useSettingsPrefs, type ThemePreference } from '@/hooks/useSettingsPrefs';
import { haptics } from '@/lib/haptics';
import { intro, motion } from '@/lib/motion';
import { opacity, useTheme } from '@/theme';

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const HOURS = REMINDER_HOURS;

/** Nastavení (§7.9, Teplá litina). Řádky odděluje jen hairline `rule` (jedna technika). Připomínka: Toggle + čas přes ValueWheelSheet;
 *  Odezva: dva nezávislé přepínače haptiky a zvuku;
 *  při `denied` vysvětlení a cesta do systému, na webu jen věta, že notifikace nejdou. */
export default function SettingsScreen() {
  const { c, space, size, stroke, radius } = useTheme();
  const prefs = useSettingsPrefs();
  const [wheelOpen, setWheelOpen] = useState(false);
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { hapticsEnabled, setHapticsEnabled, soundEnabled, setSoundEnabled } = prefs;
  // Motion: řádky nastoupí po sobě (fade + 10 pt, 260 ms punch, po 50 ms) při každém otevření.
  // Modal je nová scéna: nástup se hraje při každém otevření.
  const first = true;

  const web = Platform.OS === 'web';
  const denied = !web && prefs.permission === 'denied';
  const blocked = web || denied;
  const on = prefs.enabled && !blocked;

  const sendTest = async () => {
    if (busy) return;
    setBusy(true); setNote(null);
    try { await prefs.sendTest(copy.notifications.reminder(stats?.streak ?? 0)); setNote(copy.settings.sent); } catch { setNote(copy.wardrobe.actionError); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.hitLarge }}>
        <Text variant="title" accessibilityRole="header">{copy.settings.title}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={copy.common.back} style={{ width: size.hit, height: size.hit, alignItems: 'flex-end', justifyContent: 'center' }}>
          <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        {/* Cíle nahoře: to jediné tady mění trénink, ostatní je vzhled a odezva. */}
        <Row i={0} play={first}>
          <GoalsSection profile={profile} play={first} />
        </Row>

        <Row i={1} play={first}>
          <Text variant="label" tone="muted">{copy.settings.theme}</Text>
          <SegmentedControl
            options={THEMES.map((t) => ({ value: t, label: copy.settings.themeOptions[t] }))}
            value={prefs.theme}
            onChange={(t) => { haptics.tick(); prefs.setTheme(t); }}
          />
        </Row>

        <Row i={2} play={first}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.settings.reminder}</Text>
            <Toggle value={on} disabled={blocked} label={copy.settings.reminder} onChange={(v) => { haptics.tick(); void prefs.setEnabled(v); }} />
          </View>
          {web ? <Text variant="caption" tone="muted">{copy.settings.unsupported}</Text> : null}
          {denied ? (
            <View style={{ gap: space.s, alignItems: 'flex-start' }}>
              <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">{copy.settings.denied}</Text>
              <Button label={copy.settings.openSettings} variant="secondary" onPress={prefs.openSystemSettings} />
            </View>
          ) : null}
          {/* Čas připomínky: řádek → ValueWheelSheet (stejný výběr jako v onboardingu). */}
          <Pressable
            onPress={() => setWheelOpen(true)}
            disabled={!on}
            accessibilityRole="button"
            accessibilityLabel={`${copy.settings.hourPick} ${copy.settings.hourValue(prefs.hour)}`}
            accessibilityState={{ disabled: !on }}
            style={({ pressed }) => ({
              minHeight: size.hit, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m,
              opacity: on ? 1 : opacity.disabled, backgroundColor: pressed ? c.raised : 'transparent', borderRadius: radius.s,
            })}
          >
            <Text variant="body">{copy.settings.hourPick}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
              <Text variant="stat">{copy.settings.hourValue(prefs.hour)}</Text>
              <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
            </View>
          </Pressable>
          <ValueWheelSheet
            visible={wheelOpen}
            title={copy.settings.hourPick}
            options={HOURS.map((h) => ({ key: String(h), label: copy.settings.hourValue(h) }))}
            selectedIndex={HOURS.indexOf(prefs.hour)}
            onSave={(i) => { const h = HOURS[i]; if (h !== undefined) void prefs.setHour(h); setWheelOpen(false); }}
            onClose={() => setWheelOpen(false)}
          />
        </Row>

        {/* Motion spec §6.2: haptika a zvuk jsou dva nezávislé přepínače. */}
        <Row i={3} play={first}>
          <Text variant="label" tone="muted">{copy.settings.feedback}</Text>
          <SwitchRow title={copy.settings.haptics} line={copy.settings.hapticsLine} value={hapticsEnabled} onChange={setHapticsEnabled} />
          <SwitchRow title={copy.settings.sound} line={copy.settings.soundLine} value={soundEnabled} onChange={setSoundEnabled} />
        </Row>

        <Row i={4} play={first}>
          <Button label={copy.settings.sendTest} variant="secondary" disabled={blocked || prefs.permission !== 'granted' || busy} onPress={() => void sendTest()} />
          {note ? <Text variant="label" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}
        </Row>

        {__DEV__ ? (
          <Reveal play={first} delay={intro.modal.at + intro.modal.step * 5} rise={intro.modal.rise}>
          <Pressable
            onPress={() => router.push('/dev')}
            accessibilityRole="link"
            accessibilityLabel={copy.settings.dev}
            style={{ minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.settings.dev}</Text>
            <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
          </Pressable>
          </Reveal>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type GoalRoute = '/goals/milestones' | '/goals/weight' | '/goals/dream' | '/goals/path';
const tg = copy.goals;

/** Sekce Cíle: čtyři řádky (název `bodyStrong`, aktuální hodnota `caption muted`, chevron) → editory v `app/goals/*`.
 *  Načítání = hodnoty `…`, chyba = věta + Zkusit znovu (zbytek Nastavení funguje dál). */
function GoalsSection({ profile, play }: { profile: ReturnType<typeof useProfile>; play: boolean }) {
  const { space } = useTheme();
  const paths = usePathOptions();
  if (profile.status === 'error') {
    return (
      <View style={{ gap: space.m, alignItems: 'flex-start' }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{tg.section}</Text>
        <Text variant="caption" tone="muted" accessibilityRole="alert">{tg.loadError}</Text>
        <Button label={copy.common.retry} variant="secondary" onPress={profile.retry} />
      </View>
    );
  }
  const p = profile.status === 'ready' ? profile.data : null;
  const loading = profile.status === 'loading';
  const value = (v: string | undefined) => (loading ? copy.common.loading : v ?? '');
  const w = p?.weightGoal;
  // Motion (polish 2026-10-05): řádky po `intro.goalRows.step` za nástupem sekce (Row i=0); hodnoty, které
  // dorazí až po načtení, se prolnou (klíč stavu → remount Reveal). Timing, žádná pružina: řádky jsou klikatelné.
  const rowAt = (k: number) => intro.modal.at + intro.goalRows.step * (k + 1);
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="label" tone="muted" accessibilityRole="header">{tg.section}</Text>
      <GoalRow play={play} delay={rowAt(0)} loading={loading} title={tg.rows.milestones} route="/goals/milestones" disabled={!p}
        value={value(p?.milestones.map((m) => (m.custom ? copy.onboarding.milestones.customChip(m.label, m.target, m.unit) : m.label)).join(' · '))} />
      <GoalRow play={play} delay={rowAt(1)} loading={loading} title={tg.rows.weight} route="/goals/weight" disabled={!p}
        value={value(w ? (w.kind === 'none' ? tg.weightNone : tg.weightValue(w.kind, w.startKg, w.targetKg)) : undefined)} />
      <GoalRow play={play} delay={rowAt(2)} loading={loading} title={tg.rows.dream} route="/goals/dream" disabled={!p} value={value(p?.dreamBody)} />
      <GoalRow play={play} delay={rowAt(3)} loading={loading} title={tg.rows.path} route="/goals/path" disabled={!p} value={value(paths.find((x) => x.id === p?.path)?.name)} />
    </View>
  );
}

/** Řádek cíle: celá plocha je dotyková (min. `hitLarge`), stisk = výplň `raised` jako u času připomínky. */
function GoalRow({ title, value, route, disabled, play, delay, loading }: {
  title: string; value: string; route: GoalRoute; disabled: boolean; play: boolean; delay: number; loading: boolean;
}) {
  const { c, space, size, stroke, radius } = useTheme();
  const [loadingAtMount] = useState(loading);
  return (
    <Reveal play={play} delay={delay} rise={intro.modal.rise} config={motion.reveal}>
    <Pressable
      onPress={() => router.push(route)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={tg.rowA11y(title, value)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.s,
        backgroundColor: pressed ? c.raised : 'transparent', borderRadius: radius.s,
      })}
    >
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyStrong">{title}</Text>
        <Reveal key={loading ? 'loading' : 'ready'} play={loadingAtMount && !loading} rise={0} config={motion.reveal}>
          <Text variant="caption" tone="muted" numberOfLines={2}>{value}</Text>
        </Reveal>
      </View>
      <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
    </Pressable>
    </Reveal>
  );
}

/** Řádek přepínače: název `bodyStrong`, pod ním věta `caption muted`, vpravo Toggle (bez systémového tintu). */
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

function Row({ children, i, play }: { children: ReactNode; i: number; play: boolean }) {
  const { c, space } = useTheme();
  const M = intro.modal;
  return (
    <Reveal play={play} delay={M.at + M.step * i} rise={M.rise} style={{ paddingVertical: space.l, gap: space.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
      {children}
    </Reveal>
  );
}
