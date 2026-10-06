import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Reveal } from '@/components/ui/choreo';
import { PillButton } from '@/components/ui/PillButton';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { now } from '@/lib/clock';
import { customMilestone, parseMilestoneTarget } from '@/logic/onboarding';
import { opacity, useTheme } from '@/theme';
import type { Milestone, MilestoneUnit } from '@/types';

const t = copy.onboarding.milestones;
const UNIT_OPTIONS: readonly SegmentOption<MilestoneUnit>[] = (['reps', 'seconds', 'kg', 'done'] as const)
  .map((value) => ({ value, label: t.units[value] }));
const CUSTOM_LABEL_MAX = 40;

/** „+ Vlastní milník“: rozbalí inline formulář s názvem, jednotkou a cílem.
 *  Sdílí onboarding (krok 3) a Nastavení → Cíle → Milníky. */
export function CustomMilestoneForm({ disabled, onAdd }: { disabled: boolean; onAdd(m: Milestone): void }) {
  const { c, space, size, stroke } = useTheme();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [unit, setUnit] = useState<MilestoneUnit>('reps');
  const [target, setTarget] = useState('');
  const [targetError, setTargetError] = useState(false);

  const needsTarget = unit !== 'done';
  const parsedTarget = parseMilestoneTarget(target);
  const valid = label.trim().length > 0 && (!needsTarget || parsedTarget !== null);

  const close = () => { setOpen(false); setLabel(''); setUnit('reps'); setTarget(''); setTargetError(false); };
  const submit = () => {
    if (!valid || disabled) return;
    onAdd(customMilestone(label, parsedTarget ?? 1, unit, now().getTime()));
    close();
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t.addCustom}
        accessibilityState={{ disabled }}
        style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.s, alignSelf: 'flex-start', opacity: disabled ? opacity.disabled : 1 }}
      >
        <Plus color={c.text} size={size.icon} strokeWidth={stroke.icon} />
        <Text variant="bodyStrong">{t.addCustom}</Text>
      </Pressable>
    );
  }

  return (
    <Reveal play rise={8} style={{ gap: space.l, marginTop: space.m }}>
      <TextField label={t.customLabel} value={label} onChangeText={setLabel} placeholder={t.customPlaceholder} maxLength={CUSTOM_LABEL_MAX} autoFocus />
      <View style={{ gap: space.s }}>
        <Text variant="label" tone="muted">{t.customUnit}</Text>
        <SegmentedControl<MilestoneUnit> options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
      </View>
      {unit !== 'done' ? (
        <TextField
          label={t.customTarget}
          unit={t.unitShort[unit]}
          placeholder={t.targetPlaceholder[unit]}
          value={target}
          onChangeText={(v) => { setTarget(v); setTargetError(false); }}
          onBlur={() => setTargetError(target.trim() !== '' && parsedTarget === null)}
          keyboardType="number-pad"
          maxLength={4}
          error={targetError ? t.customTargetError : null}
        />
      ) : null}
      {/* Pilulky [PŘIDAT MILNÍK] / [ZRUŠIT]: obě sekundární, plné CTA obrazovky zůstává [POKRAČOVAT] dole. */}
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <View style={{ flex: 2 }}>
          <PillButton label={t.customSubmit} onPress={submit} variant="secondary" disabled={!valid || disabled} />
        </View>
        <View style={{ flex: 1 }}>
          <PillButton label={t.customCancel} onPress={close} variant="secondary" />
        </View>
      </View>
    </Reveal>
  );
}
