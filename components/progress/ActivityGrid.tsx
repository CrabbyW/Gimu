import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import type { GridCell } from '@/logic/progress';

interface Props { cells: GridCell[] }

const COLS = 7;

/** Mřížka aktivity 5 × 7 (po–ne). Aktivní = plná `text`, prázdný = obrys `rule`, budoucí = jen tlumená plocha,
 *  dnes = obrys `text` 2 pt (R42: akcent patří oslavě, dnešek nese kontrast a tvar). */
export function ActivityGrid({ cells }: Props) {
  const { c, space, radius, stroke } = useTheme();
  const [width, setWidth] = useState(0);
  const gap = space.xs;
  const cell = width > 0 ? Math.floor((width - gap * (COLS - 1)) / COLS) : 0;
  const active = cells.filter((x) => x.state === 'active').length;

  return (
    <View accessible accessibilityLabel={copy.progress.gridA11y(active)} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap }}>
      <View style={{ flexDirection: 'row', gap }}>
        {copy.progress.weekdays.map((d) => (
          <Text key={d} variant="badgeLabel" tone="muted" style={{ width: cell || undefined, flex: cell ? undefined : 1, textAlign: 'center' }}>{d}</Text>
        ))}
      </View>
      {cell > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {cells.map((x) => (
            <View
              key={x.day}
              style={{
                width: cell, height: cell, borderRadius: radius.s,
                backgroundColor: x.state === 'active' ? c.text : x.state === 'future' ? c.surface : 'transparent',
                borderWidth: x.state === 'today' ? stroke.focus : x.state === 'empty' ? 1 : 0,
                borderColor: x.state === 'today' ? c.text : c.rule,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
