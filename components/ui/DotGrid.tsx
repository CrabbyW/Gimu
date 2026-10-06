import { View } from 'react-native';
import { opacity, useTheme } from '@/theme';

/** Stav tečky: odcvičeno (`filled`), dohnáno (`soft`), zmeškáno (`outline`), budoucí (`empty`), dnes (`today`). Vzhled viz `Dot`. */
export type DotState = 'filled' | 'soft' | 'outline' | 'empty' | 'today';
export interface DotCell { key: string; state: DotState }

interface Props {
  cells: readonly DotCell[];
  columns: number;
  /** Průměr tečky v pt; výchozí `size.dot` (10). */
  size?: number;
  accessibilityLabel: string;
}

/** Mřížka dní po týdnech (řádek = týden). Celá mřížka je pro čtečku jeden obraz s popisem. */
export function DotGrid({ cells, columns, size: dotProp, accessibilityLabel }: Props) {
  const { size } = useTheme();
  const dot = dotProp ?? size.dot;
  const gap = size.dotGap;
  const cols = Math.max(1, columns);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', width: cols * dot + (cols - 1) * gap, gap }}
    >
      {cells.map((cell) => <Dot key={cell.key} state={cell.state} dot={dot} />)}
    </View>
  );
}

/** Nothing Dot fáze 2: tečky z RN View (90 dní sezóny bez Skia plátna), jazyk tečkových prvků:
 *  filled = rozsvícená `text`, soft (dohnáno) = rozsvícená s vnitřním otvorem `tile` (dlaždice je podklad),
 *  outline (zmeškáno) = tlumená `dotDim`, empty (budoucí) = zhasnutá `dotOff` na `opacity.future`,
 *  today = zhasnutá tečka s vlasovým prstencem `text` (jako dnešek v `DotMatrix`). Rozlišení jasem a tvarem, ne barvou. */
export function Dot({ state, dot }: { state: DotState; dot: number }) {
  const { c, radius, stroke } = useTheme();
  const box = { width: dot, height: dot, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full } as const;
  switch (state) {
    case 'filled':
      return <View style={[box, { backgroundColor: c.text }]} />;
    case 'soft':
      return (
        <View style={[box, { backgroundColor: c.text }]}>
          <View style={{ width: dot / 2.5, height: dot / 2.5, borderRadius: radius.full, backgroundColor: c.tile }} />
        </View>
      );
    case 'outline':
      return <View style={[box, { backgroundColor: c.dotDim }]} />;
    case 'empty':
      return <View style={[box, { backgroundColor: c.dotOff, opacity: opacity.future }]} />;
    case 'today':
      return (
        <View style={[box, { borderWidth: stroke.hairline, borderColor: c.text }]}>
          <View style={{ width: dot / 2, height: dot / 2, borderRadius: radius.full, backgroundColor: c.dotOff }} />
        </View>
      );
  }
}
