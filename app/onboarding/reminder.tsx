import { router, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { ValueWheelSheet } from '@/components/ui/ValueWheelSheet';
import { Reveal } from '@/components/ui/choreo';
import { stagger } from '@/lib/motion';
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
  const { c, space, size, stroke } = useTheme();
  const prefs = useSettingsPrefs();
  const stored = prefs.hour;
  const [hour, setHour] = useState(REMINDER_HOURS.includes(stored) ? stored : DEFAULT_HOUR);
  const [open, setOpen] = useState(false);
  const time = copy.settings.hourValue(hour);

  // Dvojí tap (Pokračovat i Bez připomínky) nesmí pushnout zrození dvakrát (QA R44 kolo 1).
  const leaving = useRef(false);
  // Po návratu Zpět ze zrození musí krok znovu reagovat.
  useFocusEffect(useCallback(() => { leaving.current = false; }, []));
  const toBirth = () => router.push('/onboarding/birth');
  const onContinue = async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      await prefs.setHour(hour);
      await prefs.setEnabled(true);
    } catch {
      // Notifikace nejdou (web, chyba služby): zrození opice to nesmí zastavit, čas zůstává uložený.
    }
    toBirth();
  };
  const onSkip = () => {
    if (leaving.current) return;
    leaving.current = true;
    void prefs.setEnabled(false);
    toBirth();
  };

  return (
    <OnboardingFrame step={5} title={t.title} lead={t.lead} canContinue onContinue={() => { void onContinue(); }}>
      <View style={{ gap: space.l }}>
        {/* Nothing Dot (obr. 2): dlaždice se štítkem nahoře a velkým Doto číslem dole. Čas je jediné
            rozhodnutí kroku, proto `hero`; klepnutí otevře kolo hodnot. */}
        <Reveal play delay={stagger(2)}>
        <Tile onPress={() => setOpen(true)} accessibilityLabel={t.timeA11y(time)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m }}>
            <Text variant="telemetry" tone="muted">{t.timeLabel}</Text>
            <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
          </View>
          <Text variant="hero" style={{ marginTop: space.m }}>{time}</Text>
        </Tile>
        </Reveal>
        <Reveal play delay={stagger(3)}>
          <Button label={t.skip} variant="ghost" onPress={onSkip} style={{ alignSelf: 'flex-start' }} />
        </Reveal>
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
