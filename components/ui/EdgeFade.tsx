import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';

interface Props {
  /** `down` = plné krytí nahoře, doznívá dolů (pod hlavičkou); `up` = plné dole, doznívá nahoru (pod CTA). */
  direction: 'down' | 'up';
  width: number;
  height: number;
  /** Zarážky krytí `base` (offset 0–1 od plné strany, krytí 0–1). Výchozí: 1 → 0. */
  stops?: readonly { at: number; opacity: number }[];
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_STOPS = [{ at: 0, opacity: 1 }, { at: 1, opacity: 0 }] as const;

/** Závoj barvy `base` pro hloubku (aesthetic: přechod jen pro hloubku): obsah pod překryvem plynule mizí,
 *  ne ostrou hranou. SVG, ne Skia (nežere rozpočet WebGL pláten na webu). Čistě dekorativní, dotyky propouští. */
export function EdgeFade({ direction, width, height, stops = DEFAULT_STOPS, style }: Props) {
  const { c } = useTheme();
  const id = `edge-fade-${useId().replace(/:/g, '')}`;
  if (width <= 0 || height <= 0) return null;
  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1={direction === 'down' ? '0' : '1'} x2="0" y2={direction === 'down' ? '1' : '0'}>
            {stops.map((s, i) => <Stop key={i} offset={s.at} stopColor={c.base} stopOpacity={s.opacity} />)}
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
