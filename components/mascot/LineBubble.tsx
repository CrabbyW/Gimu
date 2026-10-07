import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/Text';
import { dots, useTheme } from '@/theme';

interface Props {
  /** Replika opičky (`useMascotLine().line.text`). */
  text: string;
  /** Vodorovná poloha hrotu od levé hrany bubliny (pt): míří na střed opičky, i když je bublina u kraje posunutá. */
  arrowX?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Replika opičky (elite fáze 3): menší a lehčí příbuzná `GuideBubble`. Bez štítku a bez dotyku (needitovatelná
 * informace, tap jde dál na opičku), plocha `tile` s vlasovou hranou (průvodce je o tón výš `tilePressed`:
 * průvodce je úkol, replika jen poznámka). Jedna věta mono verzálkami, max. 2 řádky; pod ní tečkový hrot
 * (2 + 1 tečky) dolů k opičce. Čtečka ji ohlásí (live region). Pohyb nástupu/odchodu = motion-agent.
 */
export function LineBubble({ text, arrowX, style }: Props) {
  const { c, space, radius } = useTheme();
  const { d, gap, maxW } = dots.line;
  const arrowW = d * 2 + gap * 2;
  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
      style={[{ maxWidth: maxW }, style]}
    >
      <View
        style={{
          paddingHorizontal: space.s + space.xs, paddingVertical: space.s,
          backgroundColor: c.tile, borderRadius: radius.s,
          borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        }}
      >
        <Text variant="telemetry" numberOfLines={2} style={{ textAlign: 'center' }}>{text.toUpperCase()}</Text>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          alignItems: 'center', gap, paddingTop: gap, width: arrowW,
          ...(arrowX === undefined ? { alignSelf: 'center' as const } : { marginLeft: arrowX - arrowW / 2 }),
        }}
      >
        <View style={{ flexDirection: 'row', gap }}>
          <Dot color={c.text} /><Dot color={c.text} />
        </View>
        <Dot color={c.text} />
      </View>
    </View>
  );
}

function Dot({ color }: { color: string }) {
  const { d } = dots.line;
  return <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />;
}
