import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { MeasureLine } from '@/components/ui/MeasureLine';
import { Stat } from '@/components/ui/Stat';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from '@/lib/motion';
import type { SeasonProgress } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { SeasonGoal } from '@/types';
import { decimal } from './format';

interface Props {
  progress: SeasonProgress;
  /** Jen u milníku: zápis aktuální hodnoty. Chyba (reject) se ukáže pod polem. */
  onRecord?(current: number): Promise<void>;
}

const unitOf = (g: SeasonGoal): string => {
  switch (g.kind) {
    case 'activeDays': return copy.season.units.activeDays;
    case 'lessons': return copy.season.units.lessons;
    case 'milestone': return copy.season.units[g.unit];
    case 'weight': return copy.season.units.weight;
  }
};

/**
 * Progres cíle sezóny. Nejdůležitější údaj tabu: obří `34 / 60 DNÍ` (Stat L), pod ním měřicí linka
 * se stejným poměrem. Typ cíle je telemetrie nad číslem, ne nadpis: číslo mluví samo.
 */
export function SeasonGoalCard({ progress, onRecord }: Props) {
  const { space } = useTheme();
  const { goal, value, target, met } = progress;
  const unit = unitOf(goal);
  const shown = decimal(value);
  // Count-up při prvním zobrazení (400 ms); popisek pro čtečku nese vždy konečnou hodnotu.
  const counted = decimal(useCountUp(value, motion.countFirstMs, Number.isInteger(value) ? 0 : 1));
  const ratio = target > 0 ? value / target : 0;
  return (
    <View style={{ gap: space.l }}>
      <View style={{ gap: space.s }}>
        <Telemetry items={[{ key: copy.season.goalLabel, value: copy.season.goalKinds[goal.kind] }]} />
        {goal.kind === 'milestone' ? <Text variant="bodyStrong">{goal.label}</Text> : null}
      </View>
      <View accessible accessibilityLabel={copy.season.progressA11y(shown, decimal(target), unit)}>
        <Stat value={counted} unit={copy.season.progressOf(decimal(target), unit)} size="L" />
      </View>
      <MeasureLine progress={ratio} accessibilityLabel={copy.season.progressA11y(shown, decimal(target), unit)} />
      {met ? <Text variant="body" tone="muted">{copy.season.met}</Text> : null}
      {goal.kind === 'milestone' && onRecord ? <RecordValue initial={goal.current} onRecord={onRecord} /> : null}
    </View>
  );
}

/** „Zapsat hodnotu“: tlačítko se rozbalí v pole s uložením. Celé číslo ≥ 0. */
function RecordValue({ initial, onRecord }: { initial: number; onRecord(current: number): Promise<void> }) {
  const { space } = useTheme();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(String(initial));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return <Button label={copy.season.record} variant="secondary" onPress={() => { setRaw(String(initial)); setError(null); setOpen(true); }} style={{ alignSelf: 'flex-start' }} />;
  }

  const save = async () => {
    if (busy) return;
    const n = /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
    if (!Number.isInteger(n) || n < 0) { setError(copy.season.recordError); return; }
    setBusy(true);
    try { await onRecord(n); setOpen(false); } catch { setError(copy.season.saveError); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: space.m }}>
      <TextField
        label={copy.season.recordField}
        value={raw}
        onChangeText={(t) => { setRaw(t); setError(null); }}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={() => { void save(); }}
        error={error}
        autoFocus
      />
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <Button label={copy.season.recordSave} onPress={() => { void save(); }} disabled={busy} />
        <Button label={copy.season.recordCancel} variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </View>
  );
}
