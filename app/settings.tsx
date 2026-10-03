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
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { REMINDER_HOURS, useSettingsPrefs, type ThemePreference } from '@/hooks/useSettingsPrefs';
import { haptics } from '@/lib/haptics';
import { intro } from '@/lib/motion';
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
        <Row i={0} play={first}>
          <Text variant="label" tone="muted">{copy.settings.theme}</Text>
          <SegmentedControl
            options={THEMES.map((t) => ({ value: t, label: copy.settings.themeOptions[t] }))}
            value={prefs.theme}
            onChange={(t) => { haptics.tick(); prefs.setTheme(t); }}
          />
        </Row>

        <Row i={1} play={first}>
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
        <Row i={2} play={first}>
          <Text variant="label" tone="muted">{copy.settings.feedback}</Text>
          <SwitchRow title={copy.settings.haptics} line={copy.settings.hapticsLine} value={hapticsEnabled} onChange={setHapticsEnabled} />
          <SwitchRow title={copy.settings.sound} line={copy.settings.soundLine} value={soundEnabled} onChange={setSoundEnabled} />
        </Row>

        <Row i={3} play={first}>
          <Button label={copy.settings.sendTest} variant="secondary" disabled={blocked || prefs.permission !== 'granted' || busy} onPress={() => void sendTest()} />
          {note ? <Text variant="label" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}
        </Row>

        {__DEV__ ? (
          <Reveal play={first} delay={intro.modal.at + intro.modal.step * 4} rise={intro.modal.rise}>
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
