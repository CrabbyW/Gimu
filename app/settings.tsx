import { router } from 'expo-router';
import { ChevronRight, Minus, Plus, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useSettingsPrefs, type ThemePreference } from '@/hooks/useSettingsPrefs';
import { haptics } from '@/lib/haptics';
import { opacity, useTheme } from '@/theme';

const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark'];
const HOUR_MIN = 5;
const HOUR_MAX = 22;

/** Nastavení (§7.9). Řádky odděluje jen hairline `rule` (jedna technika). Připomínka: Toggle + stepper hodiny;
 *  při `denied` vysvětlení a cesta do systému, na webu jen věta, že notifikace nejdou. */
export default function SettingsScreen() {
  const { c, space, size, stroke } = useTheme();
  const prefs = useSettingsPrefs();
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <Text variant="label" tone="muted" accessibilityRole="header">{copy.settings.title.toUpperCase()}</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={copy.common.back} style={{ width: size.hit, height: size.hit, alignItems: 'flex-end', justifyContent: 'center' }}>
          <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <Row>
          <Text variant="label" tone="muted">{copy.settings.theme}</Text>
          <SegmentedControl
            options={THEMES.map((t) => ({ value: t, label: copy.settings.themeOptions[t] }))}
            value={prefs.theme}
            onChange={(t) => { haptics.tick(); prefs.setTheme(t); }}
          />
        </Row>

        <Row>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="label" tone="muted">{copy.settings.hour}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
              <StepButton label={copy.settings.hourDown} disabled={!on || prefs.hour <= HOUR_MIN} onPress={() => void prefs.setHour(prefs.hour - 1)}>
                <Minus size={size.icon} color={c.text} strokeWidth={stroke.icon} />
              </StepButton>
              <Text variant="counter" accessibilityLabel={`${copy.settings.hour} ${copy.settings.hourValue(prefs.hour)}`} accessibilityLiveRegion="polite">
                {copy.settings.hourValue(prefs.hour)}
              </Text>
              <StepButton label={copy.settings.hourUp} disabled={!on || prefs.hour >= HOUR_MAX} onPress={() => void prefs.setHour(prefs.hour + 1)}>
                <Plus size={size.icon} color={c.text} strokeWidth={stroke.icon} />
              </StepButton>
            </View>
          </View>
        </Row>

        <Row>
          <Button label={copy.settings.sendTest} variant="secondary" disabled={blocked || prefs.permission !== 'granted' || busy} onPress={() => void sendTest()} />
          {note ? <Text variant="label" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}
        </Row>

        {__DEV__ ? (
          <Pressable
            onPress={() => router.push('/dev')}
            accessibilityRole="link"
            accessibilityLabel={copy.settings.dev}
            style={{ minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }}>{copy.settings.dev}</Text>
            <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ children }: { children: ReactNode }) {
  const { c, space } = useTheme();
  return <View style={{ paddingVertical: space.l, gap: space.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>{children}</View>;
}

function StepButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress(): void; children: ReactNode }) {
  const { c, size, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ width: size.hit, height: size.hit, borderRadius: radius.full, borderWidth: 1, borderColor: c.rule, alignItems: 'center', justifyContent: 'center', opacity: disabled ? opacity.disabled : 1 }}
    >
      {children}
    </Pressable>
  );
}
