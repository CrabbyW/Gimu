import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { copy } from '@/data/copy';
import type { Milestone } from '@/types';
import { NumberSheet } from './NumberSheet';

interface Props {
  milestone: Milestone | null;
  onSave(current: number): Promise<void>;
  onClose(): void;
}

// Celá čísla 0–9999; u kg i jedno desetinné místo (čárka povolena).
const parse = (raw: string, unit: Milestone['unit']): number | null => {
  const s = raw.trim().replace(',', '.');
  const ok = unit === 'kg' ? /^\d{1,4}(\.\d)?$/.test(s) : /^\d{1,4}$/.test(s);
  return ok ? Number(s) : null;
};

/** Zápis aktuální hodnoty milníku. Binární milník („splněno“) nemá pole, jen jedno přepínací tlačítko. */
export function MilestoneSheet({ milestone: m, onSave, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  if (!m) return null;
  const binary = m.unit === 'done';
  const unit = m.unit === 'done' ? undefined : copy.onboarding.milestones.unitShort[m.unit];
  const done = m.current >= m.target;

  const toggleBinary = async () => {
    if (busy) return;
    setBusy(true);
    try { await onSave(done ? 0 : m.target); } finally { setBusy(false); }
  };

  return (
    <NumberSheet
      visible
      title={m.label}
      fieldLabel={copy.progress.milestoneField}
      unit={unit}
      initial={String(m.current)}
      hideField={binary}
      extra={binary ? <Button label={done ? copy.progress.milestoneUndo : copy.progress.milestoneMarkDone} onPress={toggleBinary} disabled={busy} /> : undefined}
      validate={(raw) => (parse(raw, m.unit) === null ? copy.progress.milestoneError : null)}
      onSubmit={async (raw) => { await onSave(parse(raw, m.unit)!); }}
      onClose={onClose}
    />
  );
}
