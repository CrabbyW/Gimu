import { View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Stav tečky:
 * - `filled`  plná v `text` (odcvičený den)
 * - `soft`    plná v `muted` (dohnaný den)
 * - `outline` obrys v `muted` (zameškaný den)
 * - `empty`   malá tečka v `rule` (budoucí den: místo v mřížce, ne stav)
 * - `today`   prstenec v `text` s jádrem: stav nese tvar a kontrast, ne akcent (R42 místo plánovaného `accent`).
 */
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

export function Dot({ state, dot }: { state: DotState; dot: number }) {
  const { c, radius, stroke } = useTheme();
  const box = { width: dot, height: dot, alignItems: 'center', justifyContent: 'center' } as const;
  switch (state) {
    case 'filled':
      return <View style={[box, { borderRadius: radius.full, backgroundColor: c.text }]} />;
    case 'soft':
      return <View style={[box, { borderRadius: radius.full, backgroundColor: c.muted }]} />;
    case 'outline':
      return <View style={[box, { borderRadius: radius.full, borderWidth: 1, borderColor: c.muted }]} />;
    case 'empty':
      // Budoucnost je rastr, ne stav: třetinová tečka v `rule`, aby mřížka měla tvar a nekřičela.
      return <View style={box}><View style={{ width: dot / 3, height: dot / 3, borderRadius: radius.full, backgroundColor: c.rule }} /></View>;
    case 'today':
      return (
        <View style={[box, { borderRadius: radius.full, borderWidth: stroke.focus, borderColor: c.text }]}>
          <View style={{ width: dot / 3, height: dot / 3, borderRadius: radius.full, backgroundColor: c.text }} />
        </View>
      );
  }
}
