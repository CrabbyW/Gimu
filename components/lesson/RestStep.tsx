import { useEffect } from 'react';
import { View } from 'react-native';
import { Mascot, useMascotAct } from '@/components/mascot';
import { eventToRepertoire } from '@/logic/mascotRepertoire';
import { DotRing } from '@/components/dots';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { typography, useShort, useTheme } from '@/theme';
import type { CosmeticSlot, Exercise, MascotStage } from '@/types';
import { LessonStepEnter } from './LessonStepEnter';
import { splitTip } from './tip';
import { useRestTimer } from './useRestTimer';

interface Props {
  /** Cvik, který přijde po pauze. */
  next: Exercise;
  /** Konec pauzy: odpočet doběhl nebo [SKIP REST]. Rodič hlídá, ať proběhne jen jednou. */
  onContinue(): void;
  /** Mini opička v pauze (repertoár `wipeSweat`): vzhled. Bez ní pauza beze změny. */
  coach?: { stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>> };
}

/**
 * Pauza mezi cviky (UX pass U1). Hierarchie: 1) velký tečkový odpočet (DotRing + Doto sekundy) — jediné, co
 * cvičenec během vydýchání potřebuje vědět; 2) dlaždice „Next up“ s názvem, dávkou a jedním tipem techniky
 * (připraví se, aniž by musel číst kartu); 3) lišta: [SKIP REST] plná, [+15 S] sekundární. V nule pokračuje sama.
 */
export function RestStep({ next, onContinue, coach }: Props) {
  const { space, size } = useTheme();
  const short = useShort();
  const timer = useRestTimer(onContinue);
  const hold = next.type === 'hold';
  const { tip } = splitTip(next.description);
  const ring = short ? size.holdRingShort : size.holdRing;
  // Mini opička v pauze utře pot a napije se (repertoár `wipeSweat`), jednou při nástupu pauzy.
  const acts = useMascotAct();
  const { play } = acts;
  useEffect(() => {
    const id = eventToRepertoire({ type: 'rest' });
    if (id && coach) play(id);
    // Jednou za pauzu (RestStep je klíčovaný cvikem).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <LessonStepEnter style={{ flex: 1, justifyContent: 'center', gap: short ? space.m : space.xl, paddingVertical: short ? space.s : space.l }}>
        <View style={{ alignSelf: 'stretch' }}>
        <View
          accessible
          accessibilityRole="timer"
          accessibilityLabel={copy.lesson.restA11y(timer.secondsLeft)}
          testID="rest-timer"
          style={{ alignSelf: 'center', alignItems: 'center', gap: short ? space.xs : space.s }}
        >
          <Text variant="label" tone="muted">{copy.lesson.restLabel}</Text>
          <DotRing progress={timer.progress} size={ring}>
            <Text variant={short ? 'heroShort' : 'hero'} maxFontSizeMultiplier={1}>{timer.secondsLeft}</Text>
          </DotRing>
          <View style={{ minHeight: typography.label.lineHeight }}>
            <Text variant="label" tone="muted">{copy.lesson.seconds}</Text>
          </View>
        </View>
        {/* Mini opička vpravo dole u prstence (roh mimo kruh), dekorativní. */}
        {coach ? (
          <View testID="rest-coach" pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: 0 }}>
            <Mascot stage={coach.stage} cosmetics={coach.cosmetics} mood="idle" size={size.mascotMini} act={acts.act} hop={false} breathe={false} decorative />
          </View>
        ) : null}
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
      </LessonStepEnter>
      <View style={{ marginHorizontal: -space.l }}>
        <BigActionBar
          primary={{ label: copy.lesson.restSkip, onPress: onContinue }}
          secondary={timer.canExtend ? { label: copy.lesson.restExtend, onPress: timer.extend } : undefined}
        />
      </View>
    </>
  );
}
