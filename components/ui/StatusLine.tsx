import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface StatusLineProps {
  /** Mono štítek vlevo (verzálky dodá varianta `telemetry`), např. „SEKCE 01“. */
  left: string;
  /** Živý údaj vpravo („12 DNÍ“). */
  right?: string;
  /** Před pravým údajem tečka `text`; motion-agent ji rozbliká (`motion.liveBlinkMs`) přes `liveDotStyle`. */
  live?: boolean;
  /** Animovaný styl živé tečky (opacita); staticky plná. */
  liveDotStyle?: StyleProp<ViewStyle>;
  /** Hlasitý popis pravé části (např. „Série 12 dní, dnes čeká“). */
  rightA11y?: string;
}

/** Stavový řádek (spec §2.3, obr. 1 „INTERSTELLAR … ● 00:30“): mono 11 vlevo `muted`, vpravo údaj `text`
 *  s živou tečkou. Žádná barva: tečka je `text`, nese ji pohyb, ne odstín. */
export function StatusLine({ left, right, live = false, liveDotStyle, rightA11y }: StatusLineProps) {
  const { c, space, size, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.hit / 2, gap: space.m }}>
      <Text variant="telemetry" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>{left}</Text>
      {right ? (
        <View
          accessible
          accessibilityLabel={rightA11y ?? right}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}
        >
          {live ? (
            <Animated.View
              testID="status-live-dot"
              style={[{ width: size.liveDot, height: size.liveDot, borderRadius: radius.full, backgroundColor: c.text }, liveDotStyle]}
            />
          ) : null}
          <Text variant="telemetry" numberOfLines={1}>{right}</Text>
        </View>
      ) : null}
    </View>
  );
}
