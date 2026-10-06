import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Reveal } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTilePress } from '@/components/ui/useTilePress';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { seasonActions, useSeasonStatus } from '@/hooks/useSeason';
import { intro, motion, stagger } from '@/lib/motion';
import { validateSeasonGoal, type SeasonGoalCheck } from '@/logic/season';
import { opacity, useTheme } from '@/theme';
import type { Milestone, Season, SeasonGoal, UserProfile } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';

type Kind = SeasonGoal['kind'];
type Unit = 'reps' | 'seconds';
type Dir = 'down' | 'up';
type Code = Exclude<SeasonGoalCheck, 'ok'>;

const t = copy.season;
const KINDS: Kind[] = ['activeDays', 'lessons', 'milestone', 'weight'];
const UNIT_OPTIONS: readonly SegmentOption<Unit>[] = [{ value: 'reps', label: t.milestoneUnit.reps }, { value: 'seconds', label: t.milestoneUnit.seconds }];
const DIR_OPTIONS: readonly SegmentOption<Dir>[] = [{ value: 'down', label: t.weightDir.down }, { value: 'up', label: t.weightDir.up }];
const CUSTOM = 'custom';

// Vstup z klávesnice: nečíslo propadne jako NaN a odmítne ho `validateSeasonGoal` (jeden zdroj pravdy o rozsazích).
const int = (raw: string) => (/^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN);
const dec = (raw: string) => (/^\d+([.,]\d+)?$/.test(raw.trim()) ? Number(raw.trim().replace(',', '.')) : NaN);
const isCode = (m: string): m is Code => m === 'daysRange' || m === 'countRange' || m === 'targetRange' || m === 'deltaRange';
const seasonMilestones = (p: UserProfile | null): (Milestone & { unit: Unit })[] =>
  (p?.milestones ?? []).filter((m): m is Milestone & { unit: Unit } => m.unit === 'reps' || m.unit === 'seconds');

/** Nastavení cíle sezóny (Task 24 Step 4): typ, hodnota, Lock in. */
export default function SeasonGoalScreen() {
  const status = useSeasonStatus();
  const profile = useProfile();
  if (status.status === 'loading' || profile.status === 'loading') return <DotLoaderScreen />;
  if (status.status === 'error') return <ErrorState what={t.errorWhat} onRetry={status.retry} />;
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (!status.data || status.data.phase !== 'active') return <ErrorState message={t.ended} actionLabel={copy.common.back} onRetry={close} />;
  return <GoalForm season={status.data.season} existing={status.data.goal} profile={profile.data} />;
}

function close() {
  if (router.canGoBack()) router.back(); else router.replace('/(tabs)/season');
}

function GoalForm({ season, existing, profile }: { season: Season; existing: SeasonGoal | null; profile: UserProfile | null }) {
  const { c, space, size, stroke, radius } = useTheme();
  const milestones = seasonMilestones(profile);
  const [kind, setKind] = useState<Kind | null>(existing?.kind ?? null);
  const [count, setCount] = useState(existing?.kind === 'activeDays' ? String(existing.days) : existing?.kind === 'lessons' ? String(existing.count) : '');
  const [kg, setKg] = useState(existing?.kind === 'weight' ? String(Math.abs(existing.deltaKg)) : '');
  const [dir, setDir] = useState<Dir>(existing?.kind === 'weight' ? (existing.deltaKg > 0 ? 'up' : 'down') : profile?.weightGoal.kind === 'gain' ? 'up' : 'down');
  const [pick, setPick] = useState<string | null>(existing?.kind === 'milestone' ? CUSTOM : milestones[0]?.id ?? CUSTOM);
  const [name, setName] = useState(existing?.kind === 'milestone' ? existing.label : '');
  const [target, setTarget] = useState(existing?.kind === 'milestone' ? String(existing.target) : '');
  const [current, setCurrent] = useState(existing?.kind === 'milestone' ? String(existing.current) : '');
  const [unit, setUnit] = useState<Unit>(existing?.kind === 'milestone' ? existing.unit : 'reps');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setError(null); };

  const build = (): SeasonGoal | string => {
    switch (kind) {
      case 'activeDays': return { kind, days: int(count) };
      case 'lessons': return { kind, count: int(count) };
      case 'weight': { const d = dec(kg); return { kind, deltaKg: dir === 'down' ? -d : d }; }
      case 'milestone': {
        const m = milestones.find((x) => x.id === pick);
        if (m) return { kind, label: m.label, target: m.target, unit: m.unit, current: m.current, start: m.current };
        if (name.trim() === '') return t.nameMissing;
        const now = current.trim() === '' ? 0 : int(current);
        // Úprava stávajícího vlastního milníku drží původní start (recap „před“).
        const start = existing?.kind === 'milestone' && existing.label === name.trim() ? existing.start : now;
        return { kind, label: name.trim(), target: int(target), unit, current: now, start };
      }
      default: return t.saveError;
    }
  };

  const submit = async () => {
    if (busy || !kind) return;
    const goal = build();
    if (typeof goal === 'string') { setError(goal); return; }
    const check = validateSeasonGoal(goal, season);
    if (check !== 'ok') { setError(t.goalErrors[check]); return; }
    setBusy(true);
    try {
      await seasonActions.setGoal(season.id, goal);
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(isCode(msg) ? t.goalErrors[msg] : t.saveError);
    } finally {
      setBusy(false);
    }
  };

  const filled = kind === 'activeDays' || kind === 'lessons' ? count.trim() !== ''
    : kind === 'weight' ? kg.trim() !== ''
      : kind === 'milestone' ? pick !== CUSTOM || (name.trim() !== '' && target.trim() !== '')
        : false;

  return (
    <ReactiveBackground style={{ backgroundColor: c.base }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top']} scroll transparent>
        <View style={{ paddingTop: space.m, gap: space.xl }}>
          {/* Motion: hlavička → dlaždice 2×2 po 50 ms → pole hodnoty (při změně typu znovu, `motion.ui`). */}
          <Reveal play delay={intro.modal.at} rise={intro.modal.rise} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.m }}>
            <View style={{ flex: 1, gap: space.s, paddingTop: space.l }}>
              <Text variant="label" tone="muted">{season.name}</Text>
              <Text variant="display" accessibilityRole="header">{t.goalTitle}</Text>
              <Text variant="body" tone="muted">{t.goalLead}</Text>
            </View>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={({ pressed }) => ({
                width: size.iconButton, height: size.iconButton, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? c.tilePressed : c.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
              })}
            >
              <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
            </Pressable>
          </Reveal>

          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {KINDS.map((k, i) => (
              <KindTile i={i} key={k} title={t.goalKinds[k]} line={t.goalKindLines[k]} selected={kind === k} onPress={() => { setKind(k); setError(null); }} />
            ))}
          </View>

          <Reveal key={kind ?? 'none'} play={kind !== null} rise={8} config={motion.ui}>
          {kind === 'activeDays' || kind === 'lessons' ? (
            <TextField
              label={t.goalValue[kind]}
              unit={kind === 'activeDays' ? copy.recap.units.days : copy.recap.units.lessons}
              value={count}
              onChangeText={edit(setCount)}
              keyboardType="number-pad"
              maxLength={3}
              error={error}
            />
          ) : kind === 'weight' ? (
            <View style={{ gap: space.l }}>
              <SegmentedControl<Dir> options={DIR_OPTIONS} value={dir} onChange={edit(setDir)} />
              <TextField label={t.goalValue.weight} unit={copy.recap.units.kg} value={kg} onChangeText={edit(setKg)} keyboardType="decimal-pad" maxLength={4} error={error} />
            </View>
          ) : kind === 'milestone' ? (
            <View style={{ gap: space.l }}>
              <View accessibilityRole="radiogroup" style={{ gap: space.xs }}>
                <Text variant="label" tone="muted">{t.milestonePick}</Text>
                {milestones.map((m) => (
                  <RadioRow key={m.id} label={t.milestoneChip(m.label, m.target, m.unit)} selected={pick === m.id} onPress={() => { setPick(m.id); setError(null); }} />
                ))}
                <RadioRow label={t.milestoneCustom} selected={pick === CUSTOM} onPress={() => { setPick(CUSTOM); setError(null); }} />
              </View>
              {pick === CUSTOM ? (
                <View style={{ gap: space.l }}>
                  <TextField label={t.milestoneName} value={name} onChangeText={edit(setName)} maxLength={40} />
                  <SegmentedControl<Unit> options={UNIT_OPTIONS} value={unit} onChange={edit(setUnit)} />
                  <TextField label={t.milestoneTarget} value={target} onChangeText={edit(setTarget)} keyboardType="number-pad" maxLength={4} />
                  <TextField label={t.milestoneCurrent} value={current} onChangeText={edit(setCurrent)} keyboardType="number-pad" maxLength={4} placeholder="0" />
                </View>
              ) : null}
              {error ? <Text variant="caption" style={{ color: c.danger }} accessibilityLiveRegion="polite">{error}</Text> : null}
            </View>
          ) : null}
          </Reveal>
        </View>
      </Screen>
      <BigActionBar primary={{ label: t.lockIn, onPress: () => { void submit(); }, disabled: !kind || !filled || busy }} />
    </KeyboardAvoidingView>
    </ReactiveBackground>
  );
}

/** Dlaždice typu cíle (2×2, Nothing Dot fáze 2): plocha `tile`, radius 28. Výběr = hrana `text` 2 pt a mono
 *  štítek „VYBRÁNO“, ne výplň (stejná gramatika jako karty volby v onboardingu). Výška se nemění: štítek má
 *  rezervované místo i u nevybrané dlaždice, takže mřížka při výběru neposkočí. */
function KindTile({ title, line, selected, onPress, i }: { title: string; line: string; selected: boolean; onPress(): void; i: number }) {
  const { c, space, radius, size, stroke } = useTheme();
  // Motion: nástup ve sledu; stisk = naklopení k prstu (`useTilePress`, bez pružiny); výběr = prolnutí
  // hrany `text`, štítku a názvu muted → text (`useSelectionProgress`). Hrana je vrstva: layout se nehýbe.
  const box = useRef<View>(null);
  const press = useTilePress(box, opacity.edgeLit);
  const sel = useSelectionProgress(selected);
  const selStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  const offStyle = useAnimatedStyle(() => ({ opacity: 1 - sel.value }));
  const edge = { borderRadius: radius.tile, borderColor: c.text } as const;
  return (
    <Reveal play delay={intro.modal.at + intro.modal.step + stagger(i, intro.modal.step)} rise={intro.modal.rise} style={{ flexBasis: '45%', flexGrow: 1 }}>
    <Animated.View ref={box} style={press.style}>
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${line}`}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => ({
        minHeight: size.choiceCard, padding: size.tilePad, gap: space.xs,
        borderRadius: radius.tile, backgroundColor: pressed ? c.tilePressed : c.tile,
        borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
      })}
    >
      <Animated.View style={selStyle}>
        <Text variant="label" tone="text" importantForAccessibility="no">{t.selected}</Text>
      </Animated.View>
      <View>
        <Animated.View style={offStyle}><Text variant="bodyStrong" tone="muted">{title}</Text></Animated.View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, selStyle]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text variant="bodyStrong" tone="text">{title}</Text>
        </Animated.View>
      </View>
      <Text variant="caption" tone="muted">{line}</Text>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, edge, { borderWidth: stroke.focus }, selStyle]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, edge, { borderWidth: StyleSheet.hairlineWidth }, press.edgeStyle]} />
    </Pressable>
    </Animated.View>
    </Reveal>
  );
}

/** Řádek volby milníku: kruh výběru (obrys → plné jádro) a popisek, dotyková plocha 44 pt. */
function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  const { c, space, size, radius } = useTheme();
  // Motion: jádro výběru vyroste 0.4 → 1 s prolnutím (`motion.ui`, zrušení `uiExit`), bez pružiny.
  const sel = useSelectionProgress(selected);
  const dot = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scale: 0.4 + 0.6 * sel.value }] }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.m }}
    >
      <View style={{ width: size.icon, height: size.icon, borderRadius: radius.full, borderWidth: 1, borderColor: selected ? c.text : c.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[dot, { width: size.dot, height: size.dot, borderRadius: radius.full, backgroundColor: c.text }]} />
      </View>
      <Text variant="body" style={{ flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}
