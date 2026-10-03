import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ValueWheelSheet } from '@/components/ui/ValueWheelSheet';
import { copy } from '@/data/copy';
import { REMINDER_HOURS, useSettingsPrefs } from '@/hooks/useSettingsPrefs';
import { useTheme } from '@/theme';

const t = copy.onboarding.reminder;
/** Výchozí čas připomínky (Teplá litina §3.7): 18:00. */
const DEFAULT_HOUR = 18;

/** Poslední krok před zrozením opice (Teplá litina §3.7): čas připomínky přes ValueWheelSheet.
 *  „Pokračovat“ uloží čas a zapne připomínku přes `useSettingsPrefs.setEnabled` (ten sám požádá o oprávnění;
 *  odmítnutí krok neblokuje, připomínka jen zůstane vypnutá). Ghost „Bez připomínky“ ji nechá vypnutou. */
export default function ReminderStep() {
  const { c, space, size, stroke, radius } = useTheme();
  const prefs = useSettingsPrefs();
  const stored = prefs.hour;
  const [hour, setHour] = useState(REMINDER_HOURS.includes(stored) ? stored : DEFAULT_HOUR);
  const [open, setOpen] = useState(false);
  const time = copy.settings.hourValue(hour);

  const toBirth = () => router.push('/onboarding/birth');
  const onContinue = async () => {
    try {
      await prefs.setHour(hour);
      await prefs.setEnabled(true);
    } catch {
      // Notifikace nejdou (web, chyba služby): zrození opice to nesmí zastavit, čas zůstává uložený.
    }
    toBirth();
  };
  const onSkip = () => {
    void prefs.setEnabled(false);
    toBirth();
  };

  return (
    <OnboardingFrame step={5} title={t.title} lead={t.lead} canContinue onContinue={() => { void onContinue(); }}>
      <View style={{ gap: space.l }}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t.timeA11y(time)}
          style={({ pressed }) => ({
            minHeight: size.hitLarge, paddingHorizontal: space.m, borderRadius: radius.l,
            backgroundColor: pressed ? c.raised : c.surface,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m,
          })}
        >
          <Text variant="body" tone="muted">{t.timeLabel}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
            <Text variant="display">{time}</Text>
            <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
          </View>
        </Pressable>
        <Button label={t.skip} variant="ghost" onPress={onSkip} style={{ alignSelf: 'flex-start' }} />
      </View>
      <ValueWheelSheet
        visible={open}
        title={copy.settings.hourPick}
        options={REMINDER_HOURS.map((h) => ({ key: String(h), label: copy.settings.hourValue(h) }))}
        selectedIndex={REMINDER_HOURS.indexOf(hour)}
        onSave={(i) => { const h = REMINDER_HOURS[i]; if (h !== undefined) setHour(h); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </OnboardingFrame>
  );
}
