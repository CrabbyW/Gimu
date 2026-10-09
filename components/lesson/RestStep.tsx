import { View } from 'react-native';
import { DotRing } from '@/components/dots';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { typography, useShort, useTheme } from '@/theme';
import type { Exercise } from '@/types';
import { splitTip } from './tip';
import { useRestTimer } from './useRestTimer';

interface Props {
  /** Cvik, který přijde po pauze. */
  next: Exercise;
  /** Konec pauzy: odpočet doběhl nebo [SKIP REST]. Rodič hlídá, ať proběhne jen jednou. */
  onContinue(): void;
}

/**
 * Pauza mezi cviky (UX pass U1). Hierarchie: 1) velký tečkový odpočet (DotRing + Doto sekundy) — jediné, co
 * cvičenec během vydýchání potřebuje vědět; 2) dlaždice „Next up“ s názvem, dávkou a jedním tipem techniky
 * (připraví se, aniž by musel číst kartu); 3) lišta: [SKIP REST] plná, [+15 S] sekundární. V nule pokračuje sama.
 */
export function RestStep({ next, onContinue }: Props) {
  const { space, size } = useTheme();
  const short = useShort();
  const timer = useRestTimer(onContinue);
  const hold = next.type === 'hold';
  const { tip } = splitTip(next.description);
  const ring = short ? size.holdRingShort : size.holdRing;
  return (
    <>
      <View style={{ flex: 1, justifyContent: 'center', gap: short ? space.m : space.xl, paddingVertical: short ? space.s : space.l }}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={copy.lesson.restA11y(timer.secondsLeft)}
          testID="rest-timer"
          style={{ alignSelf: 'center', alignItems: 'center', gap: short ? space.xs : space.s }}
        >
          <Text variant="label" tone="muted">{copy.lesson.restLabel}</Text>
          <DotRing progress={timer.total > 0 ? timer.secondsLeft / timer.total : 0} size={ring}>
            <Text variant={short ? 'heroShort' : 'hero'} maxFontSizeMultiplier={1}>{timer.secondsLeft}</Text>
          </DotRing>
          <View style={{ minHeight: typography.label.lineHeight }}>
            <Text variant="label" tone="muted">{copy.lesson.seconds}</Text>
          </View>
        </View>
        <Tile pad={short ? 'compact' : 'default'} accessibilityLabel={`${copy.lesson.nextUp(next.name, copy.lesson.dose(next.amount, hold))}. ${copy.lesson.tipA11y(tip)}`}>
          <View testID="rest-next" style={{ gap: space.xs }}>
            <Text variant="label" tone="muted">{copy.lesson.restNextLabel}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.s }}>
              <Text variant="headline">{next.name}</Text>
              <Text variant="telemetry" tone="muted">{copy.lesson.dose(next.amount, hold)}</Text>
            </View>
            <Text variant={short ? 'caption' : 'body'} tone="muted">{tip}</Text>
          </View>
        </Tile>
      </View>
      <View style={{ marginHorizontal: -space.l }}>
        <BigActionBar
          primary={{ label: copy.lesson.restSkip, onPress: onContinue }}
          secondary={timer.canExtend ? { label: copy.lesson.restExtend, onPress: timer.extend } : undefined}
        />
      </View>
    </>
  );
}
