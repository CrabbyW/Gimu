import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useEffect } from 'react';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
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
  const blink = useLiveBlink(live);
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
              style={[{ width: size.liveDot, height: size.liveDot, borderRadius: radius.full, backgroundColor: c.text }, blink, liveDotStyle]}
            />
          ) : null}
          <Text variant="telemetry" numberOfLines={1}>{right}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Nejnižší opacita živé tečky v cyklu (nezhasne úplně: údaj pořád čte jako „živý“, ne jako chybějící). */
const BLINK_LOW = 0.15;

/** Živá tečka (spec §3): jeden cyklus rozsvícení a zhasnutí za `motion.liveBlinkMs`, sinus, nekonečně, UI vlákno.
 *  Omezený pohyb: tečka stojí plná. */
function useLiveBlink(live: boolean) {
  const { reduced } = useMotionSafe();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!live || reduced) { cancelAnimation(o); o.value = 1; return; }
    o.value = 1;
    o.value = withRepeat(withTiming(BLINK_LOW, { duration: motion.liveBlinkMs / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(o);
  }, [live, reduced, o]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}
