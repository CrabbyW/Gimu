import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DotSteps } from '@/components/ui/DotSteps';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

// Dočasná náhledová obrazovka (ruling R16): maskot a UI primitiva v reálném použití pro design review
// v light i dark. Dostupná bez profilu na /dev-preview. Task 11 ji smaže.

type PreviewMood = 'idle' | 'happy';
type WeightGoal = 'lose' | 'gain' | 'none';

const noop = () => undefined;
const w = copy.onboarding.weight;
const moodOptions: readonly SegmentOption<PreviewMood>[] = [
  { value: 'idle', label: copy.devPreview.moodIdle },
  { value: 'happy', label: copy.devPreview.moodHappy },
];
const goalOptions: readonly SegmentOption<WeightGoal>[] = [
  { value: 'lose', label: w.lose },
  { value: 'gain', label: w.gain },
  { value: 'none', label: w.none },
];

export default function DevPreview() {
  const { c, space } = useTheme();
  const [mood, setMood] = useState<PreviewMood>('idle');
  const [goal, setGoal] = useState<WeightGoal>('lose');
  const [current, setCurrent] = useState('72,5');
  const [target, setTarget] = useState('80');
  const [milestone, setMilestone] = useState('');
  const [showError, setShowError] = useState(false);

  if (showError) return <ErrorState what={copy.common.loadTarget.profile} onRetry={() => setShowError(false)} />;

  const section = { gap: space.l, paddingTop: space.xl, marginTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule };

  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <Screen edges={['top']} scroll>
        <View style={{ paddingTop: space.l, gap: space.s }}>
          <Text variant="label" tone="muted">{copy.devPreview.screenLabel}</Text>
          <Text variant="display">{copy.onboarding.birth.title}</Text>
          <Text tone="muted">{copy.onboarding.birth.lead}</Text>
        </View>

        <View style={{ alignItems: 'center', paddingTop: space.xl, paddingBottom: space.l, gap: space.xl }}>
          <SizeSample name="L" mood={mood} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.xl }}>
            <SizeSample name="M" mood={mood} />
            <SizeSample name="S" mood={mood} />
          </View>
        </View>
        <SegmentedControl<PreviewMood> options={moodOptions} value={mood} onChange={setMood} />

        <View style={section}>
          <Text variant="label" tone="muted">{copy.devPreview.formLabel}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="label" tone="muted">{copy.onboarding.stepLabel(4, 5)}</Text>
            <DotSteps total={5} current={3} />
          </View>
          <Text variant="title">{w.title}</Text>
          <Text tone="muted">{w.lead}</Text>
          <SegmentedControl<WeightGoal> options={goalOptions} value={goal} onChange={setGoal} />
          <View style={{ gap: space.l, marginTop: space.s }}>
            <TextField label={w.current} unit={w.unit} value={current} onChangeText={setCurrent} keyboardType="decimal-pad" />
            <TextField
              label={w.target}
              unit={w.unit}
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
              error={goal === 'lose' ? w.errors.loseDirection : null}
            />
            <TextField
              label={copy.onboarding.milestones.addCustom}
              value={milestone}
              onChangeText={setMilestone}
              placeholder={copy.devPreview.milestoneExample}
            />
          </View>
        </View>

        <View style={section}>
          <Text variant="label" tone="muted">{copy.devPreview.statsLabel}</Text>
          <Stat size="XL" value={12} unit={copy.map.days} label={copy.map.streak} />
          <Stat size="L" value={340} unit={copy.map.xp} label={copy.devPreview.weekLabel} />
          <Card>
            <Stat size="M" value="72,5" unit={w.unit} label={copy.devPreview.weightLabel} />
          </Card>
        </View>

        <View style={section}>
          <Text variant="label" tone="muted">{copy.devPreview.buttonsLabel}</Text>
          <Button label={copy.map.start} onPress={noop} />
          <Button label={copy.map.replay} onPress={noop} variant="secondary" />
          <Button label={copy.common.back} onPress={noop} variant="ghost" />
          <Button label={copy.common.continue} onPress={noop} disabled />
        </View>

        <View style={[section, { marginBottom: space.l }]}>
          <Text variant="label" tone="muted">{copy.devPreview.errorLabel}</Text>
          <Button label={copy.devPreview.showError} onPress={() => setShowError(true)} variant="secondary" />
        </View>
      </Screen>
      <BigActionBar secondary={{ label: copy.common.back, onPress: noop }} primary={{ label: copy.onboarding.birth.cta, onPress: noop }} />
    </View>
  );
}

/** Maskot v pojmenované velikosti s mono štítkem rozměru pod ním. */
function SizeSample({ name, mood }: { name: 'S' | 'M' | 'L'; mood: PreviewMood }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.s, alignItems: 'center' }}>
      <Mascot stage={1} mood={mood} size={name} cosmetics={{}} />
      <Text variant="label" tone="muted">{copy.devPreview.sizeLabel(name, MASCOT_SIZES[name])}</Text>
    </View>
  );
}
