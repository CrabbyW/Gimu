import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { EmptyHint } from '@/components/ui/EmptyHint';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { GridCell } from '@/logic/progress';

interface Props {
  cells: GridCell[];
  /** Úvodní sled (motion): buňky se vyplní po dnech od nejstaršího. */
  play?: boolean;
}

const COLS = 7;

/** „2026-09-29“ → „29. 9.“ (popisek týdne vlevo od řádku). */
function weekLabel(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return copy.progress.weekShort(d ?? 0, m ?? 0);
}

/** Mřížka aktivity (Teplá litina §3.3): sloupce Po–Ne, vlevo datum pondělí každého týdne.
 *  Tečky ve stejném jazyce jako DayDot: plná `text` = aktivní, prstenec `accentGraphic` = dnes,
 *  obrys `faint` = bez aktivity, budoucí dny se nekreslí (slot zůstane prázdný, mřížka nepřeskočí).
 *  Prázdný stav (žádný aktivní den): jen aktuální týden + jedna věta, ne pět řad prázdných koleček. */
export function ActivityGrid({ cells, play = false }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const active = cells.filter((x) => x.state === 'active').length;
  const empty = active === 0;
  const weeks: GridCell[][] = [];
  for (let i = 0; i < cells.length; i += COLS) weeks.push(cells.slice(i, i + COLS));
  const shown = empty ? weeks.slice(-1) : weeks;
  // Sloupec s datem: šířka pro „29. 12.“ v caption (≈ 6 znaků × 0.6 em × 13 pt), z tokenu.
  const dateCol = size.weekCol;
  const d = size.dot;

  return (
    <View style={{ gap: space.m }}>
      <View accessible accessibilityLabel={copy.progress.gridA11y(active)} style={{ gap: space.s }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: dateCol }} />
          {copy.progress.weekdaysShort.map((w) => (
            <Text key={w} variant="caption" tone="muted" style={{ flex: 1, textAlign: 'center' }}>{w}</Text>
          ))}
        </View>
        {shown.map((week, wi) => (
          <View key={week[0]?.day ?? wi} style={{ flexDirection: 'row', alignItems: 'center', minHeight: size.todayRow / 2 + space.s }}>
            <Text variant="caption" tone="muted" style={{ width: dateCol, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
              {week[0] ? weekLabel(week[0].day) : ''}
            </Text>
            {week.map((x, di) => (
              <View key={x.day} style={{ flex: 1, alignItems: 'center' }}>
                {x.state === 'future' ? <View style={{ width: d, height: d }} /> : (
                  <Cell
                    play={play}
                    delay={intro.grid.at + (wi * COLS + di) * intro.grid.step}
                    style={{
                      width: d, height: d, borderRadius: radius.full,
                      backgroundColor: x.state === 'active' ? c.text : 'transparent',
                      borderWidth: x.state === 'active' ? 0 : stroke.icon,
                      borderColor: x.state === 'today' ? c.accentGraphic : c.faint,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      {empty ? <EmptyHint>{copy.progress.activityEmpty}</EmptyHint> : null}
    </View>
  );
}

/** Buňka dne: při úvodním sledu se „vyplní“ (opacita 0 → 1, scale 0.6 → 1, 180 ms ease-out), den po dni
 *  po 12 ms (35 buněk ≈ 420 ms). Timing, ne pružina: je to záznam, ne fyzický předmět. Omezený pohyb: stojí. */
function Cell({ play, delay, style }: { play: boolean; delay: number; style: ViewStyle }) {
  const { reduced } = useMotionSafe();
  const [animate] = useState(play && !reduced);
  const t = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) t.value = withDelay(delay, withTiming(1, { duration: intro.grid.cellMs, easing: ease.out }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.6 + 0.4 * t.value }] }));
  return <Animated.View style={[style, a]} />;
}
