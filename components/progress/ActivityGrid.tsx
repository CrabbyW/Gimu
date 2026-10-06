import { View } from 'react-native';
import { DotMatrix } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { intro } from '@/lib/motion';
import type { GridCell } from '@/logic/progress';
import { dots, useTheme } from '@/theme';
import { ACTIVITY_CELLS, activityCells } from './layout';

interface Props {
  cells: GridCell[];
  /** Dnes je odcvičeno (`todayDone` z `useProfileStats`): dnešek se počítá jako aktivní den. */
  todayDone?: boolean;
  /** Úvodní sled (motion): sken matice zleva. */
  play?: boolean;
}

/** Index dnešní buňky v mřížce, nebo null (mimo okno). */
const todayOf = (cells: GridCell[]) => {
  const i = cells.findIndex((x) => x.state === 'today');
  return i < 0 ? null : i;
};

/**
 * Aktivita (Nothing Dot fáze 2, obr. 2): celoplošná dlaždice s `DotMatrix` 7 × 5 (sloupce = dny Po–Ne,
 * řádky = posledních 5 týdnů). Rozsvícená tečka = odcvičený den, dnešek nese vlasový prstenec, nad sloupci
 * mono osa dnů. Vpravo nahoře mono součet. Prázdný stav: celá matice zhasnutá + věta, žádné NaN ani díry.
 * Jedno plátno; dotyková vlna je vlastní gesto matice.
 */
export function ActivityGrid({ cells, todayDone = false, play = false }: Props) {
  const { space } = useTheme();
  const A = dots.activity;
  const days = cells.map((x) => ({ date: x.day, active: x.state === 'active' || (x.state === 'today' && todayDone) }));
  const { lit, today } = activityCells(days, todayOf(cells));
  const active = lit.filter(Boolean).length;
  // Osa: popisek dne vystředěný nad sloupcem teček (střed první tečky = `rLit`).
  const axisShift = dots.matrix.rLit - A.pitch / 2;
  return (
    <Tile style={{ gap: space.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{copy.progress.activityLabel}</Text>
        <Text variant="label">{copy.progress.activeTally(active, ACTIVITY_CELLS)}</Text>
      </View>
      <View style={{ gap: space.s }}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', marginLeft: axisShift }}>
          {copy.progress.weekdays.map((w) => (
            <Text key={w} variant="label" tone="muted" maxFontSizeMultiplier={1} style={{ width: A.pitch, textAlign: 'center', letterSpacing: 0 }}>{w}</Text>
          ))}
        </View>
        <DotMatrix
          cols={A.cols}
          rows={A.rows}
          lit={lit}
          today={today}
          pitch={A.pitch}
          accessibilityLabel={copy.progress.gridA11y(active)}
          intro={play ? intro.grid.at : false}
        />
      </View>
      {active === 0 ? <Text variant="caption" tone="muted">{copy.progress.activityEmpty}</Text> : null}
    </Tile>
  );
}
