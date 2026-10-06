import { View, useWindowDimensions } from 'react-native';
import { DotRing } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from '@/lib/motion';
import { diffDays } from '@/logic/dates';
import { layout, useTheme } from '@/theme';
import type { Season } from '@/types';

interface Props {
  season: Season;
  /** Dny do konce včetně dneška; `null` = sezóna skončila. */
  daysLeft: number | null;
  /** Nástup (motion): prstenec spirálou se zpožděním v ms; false = stojí. */
  intro?: boolean | number;
}

/** Uplynulý podíl sezóny 0–1 (dnešek se počítá jako zbývající, stejně jako `daysLeft`). */
export function seasonElapsed(season: Season, daysLeft: number | null): number {
  if (daysLeft === null) return 1;
  const total = diffDays(season.endDate, season.startDate) + 1;
  if (!(total > 0)) return 0;
  return Math.min(1, Math.max(0, (total - daysLeft) / total));
}

/**
 * Hero sezóny (Nothing Dot fáze 2): dlaždice s odpočtem jako jediným největším číslem obrazovky
 * (Doto `displayXL`, pod `layout.narrow` `hero`) a mono „DNÍ DO KONCE“ pod ním. Vpravo `DotRing` postupu
 * sezóny: rozsvícený podíl = uplynulá část, uprostřed mono procenta. Odpočet říká „kolik“, prstenec „jakou část“.
 * Monochrom: sezónní barva patří jen odznaku a kosmetice opičky. Název a termín nese stavový řádek hlavičky.
 */
export function SeasonHeader({ season, daysLeft, intro = false }: Props) {
  const { space, size } = useTheme();
  const { width } = useWindowDimensions();
  const big = width >= layout.narrow;
  const elapsed = seasonElapsed(season, daysLeft);
  const pct = Math.round(elapsed * 100);
  // Motion: odpočet se při prvním zobrazení napočítá spolu se spirálou prstence; čtečka čte cílovou hodnotu.
  const play = intro !== false;
  const delayMs = typeof intro === 'number' ? intro : 0;
  const daysShown = useCountUp(daysLeft ?? 0, motion.countMs, 0, { enabled: play, delayMs });
  const pctShown = useCountUp(pct, motion.dotScanMs, 0, { enabled: play, delayMs });
  return (
    <Tile style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.m }}>
      {daysLeft === null ? (
        <View style={{ flexShrink: 1, gap: space.xs }}>
          <Text variant="label" tone="muted">{copy.season.endedKicker}</Text>
          <Text variant="title" accessibilityRole="header">{copy.season.ended}</Text>
        </View>
      ) : (
        <View accessible accessibilityLabel={copy.season.daysLeftA11y(daysLeft)} style={{ flexShrink: 1 }}>
          <Text variant={big ? 'displayXL' : 'hero'} numberOfLines={1}>{daysShown}</Text>
          <Text variant="label" tone="muted">{copy.season.daysLeftKicker}</Text>
        </View>
      )}
      <View style={{ alignItems: 'center', gap: space.s }}>
        <DotRing progress={elapsed} size={size.seasonRing} accessibilityLabel={copy.season.elapsedA11y(pct)} intro={intro}>
          <Text variant="label" maxFontSizeMultiplier={1} importantForAccessibility="no">{copy.season.elapsedPct(pctShown)}</Text>
        </DotRing>
        <Text variant="label" tone="muted" importantForAccessibility="no">{copy.season.elapsedKicker}</Text>
      </View>
    </Tile>
  );
}
