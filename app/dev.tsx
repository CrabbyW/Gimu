import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useDevControls } from '@/hooks/useDevControls';
import { now } from '@/lib/clock';
import { nextStageOverride, seasonEndOffset, streakLossOffset } from '@/logic/dev';
import { services } from '@/services';
import { useTheme } from '@/theme';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Potvrzení destruktivní akce. RN Web `Alert` nic nezobrazí, proto na webu `confirm` (jako v lekci). */
function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(message)) onYes();
    return;
  }
  Alert.alert(copy.dev.title, message, [{ text: copy.common.back, style: 'cancel' }, { text: copy.dev.reset, style: 'destructive', onPress: onYes }]);
}

/** Dev menu (spec §7.10): reset, XP, stage, posun času. Jen pro testování a demo. */
export default function DevScreen() {
  const { c, space, size } = useTheme();
  const { offset, stage, setDevTimeOffset, setStageOverride, resetDev } = useDevControls();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const run = (fn: () => Promise<void> | void) => async () => {
    if (busy) return;
    setBusy(true); setNote(null);
    try { await fn(); setNote(copy.dev.done); } catch (e) { setNote(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const days = Math.trunc(offset / DAY_MS);
  const hours = Math.trunc(Math.abs(offset % DAY_MS) / HOUR_MS);
  const current = now();

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: space.l, gap: space.l }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title" accessibilityRole="header">{copy.dev.title}</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={space.s}>
            <Text variant="label" tone="muted">{copy.common.back}</Text>
          </Pressable>
        </View>
        <Telemetry
          items={[
            { key: copy.dev.now, value: `${current.toLocaleDateString('cs-CZ')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}` },
            { key: copy.dev.offset, value: copy.dev.offsetValue(days, hours) },
          ]}
        />
        <Group>
          <Button variant="secondary" label={copy.dev.xp} disabled={busy} onPress={run(() => services.user.grantDevXp(500, now()))} />
          <Button variant="secondary" label={copy.dev.stage(stage)} disabled={busy} onPress={run(() => setStageOverride(nextStageOverride(stage)))} />
        </Group>
        <Group>
          <Button
            variant="secondary" label={copy.dev.seasonEnd} disabled={busy}
            onPress={run(async () => {
              const s = await services.season.getActive(now());
              if (!s) throw new Error(copy.dev.noSeason);
              // Záměrně skutečný čas (ne now()): offset se počítá od reálných hodin.
              setDevTimeOffset(seasonEndOffset(s, new Date()));
            })}
          />
          <Button variant="secondary" label={copy.dev.streakLoss} disabled={busy} onPress={run(() => setDevTimeOffset(streakLossOffset(offset)))} />
          <Button variant="secondary" label={copy.dev.resetTime} disabled={busy || offset === 0} onPress={run(() => setDevTimeOffset(0))} />
        </Group>
        <Group>
          <Pressable
            disabled={busy}
            accessibilityRole="button"
            onPress={() => confirm(copy.dev.resetConfirm, () => void run(async () => {
              await services.user.reset(); resetDev(); router.replace('/');
            })())}
            style={{ minHeight: size.hit, justifyContent: 'center' }}
          >
            <Text variant="bodyStrong" style={{ color: c.danger }}>{copy.dev.reset}</Text>
          </Pressable>
        </Group>
        {note ? <Text variant="label" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

function Group({ children }: { children: ReactNode }) {
  const { space } = useTheme();
  return <View style={{ gap: space.s }}>{children}</View>;
}
