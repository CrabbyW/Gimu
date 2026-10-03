import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { ValueWheelSheet, type WheelOption } from '@/components/ui/ValueWheelSheet';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from '@/lib/motion';
import type { SeasonProgress } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { SeasonGoal } from '@/types';
import { decimal } from './format';

interface Props {
  progress: SeasonProgress;
  /** Jen u milníku: zápis aktuální hodnoty. Chyba (reject) se ukáže pod tlačítkem. */
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

/** Rezerva nad cílem v kole hodnot (milník se dá i překonat). */
const WHEEL_HEADROOM = 10;

/**
 * Progres cíle sezóny (Teplá litina §3.4): karta, typ cíle jako SectionLabel, `display` „{hodnota} / {cíl} jednotka“
 * + progress bar. U milníku primary „Zapsat hodnotu“ přes celou šířku karty → ValueWheelSheet.
 */
export function SeasonGoalCard({ progress, onRecord }: Props) {
  const { space } = useTheme();
  const { goal, value, target, met } = progress;
  const unit = unitOf(goal);
  const shown = decimal(value);
  // Count-up při prvním zobrazení (400 ms); popisek pro čtečku nese vždy konečnou hodnotu.
  const counted = decimal(useCountUp(value, motion.countFirstMs, Number.isInteger(value) ? 0 : 1));
  const a11y = copy.season.progressA11y(shown, decimal(target), unit);
  return (
    <Card style={{ gap: space.m }}>
      <SectionLabel>{copy.season.goalLabel}</SectionLabel>
      <Text variant="headline">{goal.kind === 'milestone' ? goal.label : copy.season.goalKinds[goal.kind]}</Text>
      <View accessible accessibilityLabel={a11y} style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.s }}>
        <Text variant="display">{counted}</Text>
        <Text variant="caption" tone="muted">{copy.season.progressOf(decimal(target), unit)}</Text>
      </View>
      <ProgressBar value={value} max={target} accessibilityLabel={a11y} />
      {met ? <Text variant="body" tone="muted">{copy.season.met}</Text> : null}
      {goal.kind === 'milestone' && onRecord ? <RecordValue initial={goal.current} target={goal.target} onRecord={onRecord} /> : null}
    </Card>
  );
}

/** „Zapsat hodnotu“: plné primary přes šířku karty, výběr v ValueWheelSheet (celá čísla 0 … cíl + rezerva). */
function RecordValue({ initial, target, onRecord }: { initial: number; target: number; onRecord(current: number): Promise<void> }) {
  const { space } = useTheme();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const max = Math.max(target, initial) + WHEEL_HEADROOM;
  const options: WheelOption[] = Array.from({ length: max + 1 }, (_, i) => ({ key: String(i), label: String(i) }));

  const save = async (i: number) => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await onRecord(i); setOpen(false); } catch { setError(copy.season.saveError); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: space.s, marginTop: space.s }}>
      <Button label={copy.season.record} onPress={() => { setError(null); setOpen(true); }} loading={busy} />
      {error ? <Text variant="caption" tone="muted" accessibilityRole="alert">{error}</Text> : null}
      <ValueWheelSheet
        visible={open}
        title={copy.season.recordField}
        options={options}
        selectedIndex={Math.max(0, Math.round(initial))}
        onSave={(i) => { void save(i); }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
