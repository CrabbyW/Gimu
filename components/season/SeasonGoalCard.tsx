import { useState } from 'react';
import { View } from 'react-native';
import { DotRow } from '@/components/dots';
import { PillButton } from '@/components/ui/PillButton';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
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

/** Tečky pokroku cíle: 20 (jedna = 5 %) ve dvou řádcích po 10, řádek 10 × 16 − 6 = 154 pt se vejde i na 320 pt. */
const GOAL_DOTS = 20;
const GOAL_COLS = 10;

/**
 * Cíl sezóny (Nothing Dot fáze 2): dlaždice, mono štítek „CÍL SEZÓNY“, název cíle, Doto `display` hodnota
 * s malou jednotkou „/ 30 DNÍ“ a tečkový pokrok `DotRow` 2 × 10 (1 tečka = 5 %). U milníku pilulka
 * „Zapsat hodnotu“ → ValueWheelSheet. 1 plátno.
 */
export function SeasonGoalCard({ progress, onRecord }: Props) {
  const { space } = useTheme();
  const { goal, value, target, met } = progress;
  const unit = unitOf(goal);
  const shown = decimal(value);
  // Count-up při prvním zobrazení (400 ms); popisek pro čtečku nese vždy konečnou hodnotu.
  const counted = decimal(useCountUp(value, motion.countFirstMs, Number.isInteger(value) ? 0 : 1));
  const a11y = copy.season.progressA11y(shown, decimal(target), unit);
  const ratio = met ? 1 : target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  return (
    <Tile style={{ gap: space.m }}>
      <Text variant="label" tone="muted" accessibilityRole="header">{copy.season.goalLabel}</Text>
      <View accessible accessibilityLabel={a11y} style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.s }}>
        <Text variant="display">{counted}</Text>
        <Text variant="label" tone="muted">{copy.season.progressOf(decimal(target), unit)}</Text>
      </View>
      <DotRow total={GOAL_DOTS} fraction={ratio} columns={GOAL_COLS} />
      <Text variant="headline">{goal.kind === 'milestone' ? goal.label : copy.season.goalKinds[goal.kind]}</Text>
      {met ? <Text variant="body" tone="muted">{copy.season.met}</Text> : null}
      {goal.kind === 'milestone' && onRecord ? <RecordValue initial={goal.current} target={goal.target} onRecord={onRecord} /> : null}
    </Tile>
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
      <PillButton label={copy.season.record} onPress={() => { setError(null); setOpen(true); }} loading={busy} />
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
