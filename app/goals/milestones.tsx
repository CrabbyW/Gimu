import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GoalEditorFrame, GoalEditorGate, useGoalSubmit } from '@/components/goals/GoalEditorFrame';
import { CustomMilestoneForm } from '@/components/onboarding/CustomMilestoneForm';
import { MilestoneChip } from '@/components/onboarding/MilestoneChip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useGoals } from '@/hooks/useGoals';
import { useMilestonePresets } from '@/hooks/useOnboardingDraft';
import { haptics } from '@/lib/haptics';
import { retarget } from '@/logic/goals';
import { MILESTONES_MAX, MILESTONES_MIN, parseMilestoneTarget } from '@/logic/onboarding';
import { opacity, useTheme } from '@/theme';
import type { Milestone, UserProfile } from '@/types';

const t = copy.goals.milestones;
const tm = copy.onboarding.milestones;
const LIMIT_FLASH_MS = 1200;

/** Popisek milníku pro zobrazení: vlastní nese cíl v textu („Shyby 15×“), předvolba ho má v názvu („10 shybů“). */
const displayLabel = (m: Milestone) => (m.custom ? tm.customChip(m.label, m.target, m.unit) : m.label);

export default function MilestonesGoalScreen() {
  return <GoalEditorGate render={(profile, save) => <MilestonesEditor profile={profile} save={save} />} />;
}

/** Milníky: nahoře seznam vlastních milníků (pokrok, cíl, odebrat), pod ním přidání z předvoleb cesty nebo vlastního.
 *  Limit 2–3 se vysvětluje větou u počítadla, ne zakázaným tlačítkem bez důvodu. */
function MilestonesEditor({ profile, save }: { profile: UserProfile; save: ReturnType<typeof useGoals>['save'] }) {
  const { space } = useTheme();
  const presets = useMilestonePresets(profile.path);
  const [list, setList] = useState<Milestone[]>(profile.milestones);
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(profile.milestones.map((m) => [m.id, String(m.target)])));
  const [targetErrors, setTargetErrors] = useState<Record<string, boolean>>({});
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const [limitHit, setLimitHit] = useState(0);
  const { busy, error, submit, clearError } = useGoalSubmit(save);

  // Po odmítnutí 4. milníku věta o limitu krátce zesílí (muted → text), jako v onboardingu.
  useEffect(() => {
    if (limitHit === 0) return;
    const timer = setTimeout(() => setLimitHit(0), LIMIT_FLASH_MS);
    return () => clearTimeout(timer);
  }, [limitHit]);

  const full = list.length >= MILESTONES_MAX;
  const atMin = list.length <= MILESTONES_MIN;
  const available = presets.filter((p) => !list.some((m) => m.id === p.id));

  const add = (m: Milestone) => {
    if (full) {
      setShakes((s) => ({ ...s, [m.id]: (s[m.id] ?? 0) + 1 }));
      setLimitHit((n) => n + 1);
      return;
    }
    haptics.tick();
    clearError();
    setList((l) => [...l, m]);
    setTargets((x) => ({ ...x, [m.id]: String(m.target) }));
  };
  const remove = (id: string) => {
    if (atMin) return;
    haptics.tick();
    clearError();
    setList((l) => l.filter((m) => m.id !== id));
    setTargetErrors((e) => ({ ...e, [id]: false }));
  };

  const targetOf = (m: Milestone) => (targets[m.id] ?? String(m.target)).trim();
  const changed = list.length !== profile.milestones.length
    || list.some((m, i) => profile.milestones[i]?.id !== m.id)
    || list.some((m) => m.unit !== 'done' && targetOf(m) !== String(m.target));

  const onSave = () => {
    const errs: Record<string, boolean> = {};
    const next = list.map((m) => {
      if (m.unit === 'done') return m;
      const n = parseMilestoneTarget(targetOf(m));
      if (n === null) { errs[m.id] = true; return m; }
      return n === m.target ? m : retarget(m, n);
    });
    setTargetErrors(errs);
    if (Object.keys(errs).length > 0) return;
    void submit({ milestones: next });
  };

  const hint = full ? t.fullHint : atMin ? t.minHint : null;

  return (
    <GoalEditorFrame
      title={t.title}
      lead={t.lead}
      canSave={changed && list.length >= MILESTONES_MIN && list.length <= MILESTONES_MAX}
      busy={busy}
      error={error}
      onSave={onSave}
    >
      <View style={{ gap: space.xl }}>
        <View style={{ gap: space.s }}>
          <SectionLabel value={t.count(list.length, MILESTONES_MAX)}>{t.yours}</SectionLabel>
          {hint ? <Text variant="caption" tone={limitHit > 0 ? 'text' : 'muted'} accessibilityLiveRegion="polite">{hint}</Text> : null}
          <View>
            {list.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                target={targets[m.id] ?? String(m.target)}
                targetError={targetErrors[m.id] === true}
                canRemove={!atMin}
                onTarget={(v) => {
                  clearError();
                  setTargets((x) => ({ ...x, [m.id]: v }));
                  setTargetErrors((e) => ({ ...e, [m.id]: false }));
                }}
                onTargetBlur={() => setTargetErrors((e) => ({ ...e, [m.id]: targetOf(m) !== '' && parseMilestoneTarget(targetOf(m)) === null }))}
                onRemove={() => remove(m.id)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: space.m }}>
          <SectionLabel>{t.add}</SectionLabel>
          {available.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
              {available.map((p) => (
                <MilestoneChip
                  key={p.id}
                  label={p.label}
                  selected={false}
                  onPress={() => add({ ...p, current: 0, custom: false })}
                  shakeSignal={shakes[p.id] ?? 0}
                />
              ))}
            </View>
          ) : <Text variant="caption" tone="muted">{t.noPresets}</Text>}
          <CustomMilestoneForm disabled={full} onAdd={add} />
        </View>
      </View>
    </GoalEditorFrame>
  );
}

interface RowProps {
  milestone: Milestone;
  target: string;
  targetError: boolean;
  canRemove: boolean;
  onTarget(v: string): void;
  onTargetBlur(): void;
  onRemove(): void;
}

/** Řádek milníku: název `bodyStrong`, pokrok `caption muted`, vpravo křížek 44 pt; pod ním pole cíle (u „splněno“ není).
 *  Řádky odděluje jen hairline `rule` (stejná technika jako Nastavení). */
function MilestoneRow({ milestone: m, target, targetError, canRemove, onTarget, onTargetBlur, onRemove }: RowProps) {
  const { c, space, size, stroke, radius } = useTheme();
  const parsed = parseMilestoneTarget(target);
  // Název sleduje psaný cíl živě, aby se „10 shybů“ s polem 15 nerozcházelo.
  const label = displayLabel(parsed !== null && parsed !== m.target ? retarget(m, parsed) : m);
  return (
    <View style={{ paddingVertical: space.m, gap: space.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="bodyStrong">{label}</Text>
          <Text variant="caption" tone="muted">{t.progress(m.current, parsed ?? m.target, m.unit)}</Text>
        </View>
        <Pressable
          onPress={onRemove}
          disabled={!canRemove}
          accessibilityRole="button"
          accessibilityLabel={t.remove(label)}
          accessibilityState={{ disabled: !canRemove }}
          style={({ pressed }) => ({
            width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full,
            backgroundColor: pressed ? c.raised : 'transparent', opacity: canRemove ? 1 : opacity.disabled,
          })}
        >
          <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </View>
      {m.unit !== 'done' ? (
        <TextField
          label={tm.customTarget}
          unit={tm.unitShort[m.unit]}
          value={target}
          onChangeText={onTarget}
          onBlur={onTargetBlur}
          keyboardType="number-pad"
          maxLength={4}
          error={targetError ? tm.customTargetError : null}
        />
      ) : null}
    </View>
  );
}
