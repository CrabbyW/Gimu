import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { useReveal } from '@/components/ui/choreo';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';

interface Props {
  /** Počet kotoučů na sobě (≥ 1). */
  count: number;
  /** Šířka spodního (největšího) kotouče v pt. */
  width: number;
  /** Nástup: stoh vyroste z podlahy (výřez o výšce stohu, obsah vyjede zdola). Bez `play` stojí hned. */
  play?: boolean;
  /** ms od začátku sledu obrazovky. */
  delay?: number;
}

// Kotouče se směrem nahoru zužují o 12 % šířky na stupeň (stejný „taper“ jako činka série).
const TAPER = 0.12;
// Tóny zdola nahoru: nejtěžší dole. Klíče palety, ne barvy.
const TONES = ['plate25', 'plate20', 'plate15', 'plate10', 'plate5'] as const;

/**
 * Stoh litinových kotoučů z boku (hloubka a materiál, 2026-10-03): podstavec opičky v profilu a stupně
 * pódia v lize. Každý kotouč = deska `size.pedestalPlateH` v tónu litiny, horní vlasová hrana `edge`
 * (světlo shora) a soustružená drážka `plateShade` uprostřed boku. Obrys `muted` drží tmavé tóny
 * čitelné na `base`. Dekorativní: popis nese obalující prvek.
 */
export function PlateStack({ count, width, play = false, delay = 0 }: Props) {
  const { c, size, stroke, material } = useTheme();
  const h = size.pedestalPlateH;
  const n = Math.max(1, count);
  const H = h * n;
  // Motion (polish 2026-10-05): růst z podlahy = posun o celou výšku ve výřezu, 480 ms ease.out (UI vlákno).
  // Omezený pohyb: useReveal dá 200ms prolnutí, posun 0.
  const { reduced } = useMotionSafe();
  const t = useReveal(play, delay, motion.reveal);
  const dy = reduced ? 0 : H;
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * dy }] }));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ overflow: 'hidden' }}>
      <Animated.View style={a}>
      <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
        {Array.from({ length: n }, (_, i) => {
          // i = 0 je spodní kotouč.
          const w = width * (1 - TAPER * i);
          const x = (width - w) / 2;
          const y = H - h * (i + 1);
          const tone = TONES[Math.min(i, TONES.length - 1)]!;
          const sw = stroke.slot;
          return (
            <G key={i}>
              <Rect x={x + sw / 2} y={y + sw / 2} width={w - sw} height={h - sw} rx={material.streakPlateLg} fill={c[tone]} stroke={c.muted} strokeWidth={sw} />
              <Line x1={x + material.heroPlateW} y1={y + h / 2} x2={x + w - material.heroPlateW} y2={y + h / 2} stroke={c.plateShade} strokeWidth={stroke.slot} />
              <Line x1={x + material.streakPlateLg * 2} y1={y + sw * 1.5} x2={x + w - material.streakPlateLg * 2} y2={y + sw * 1.5} stroke={c.edge} strokeWidth={stroke.hairline} />
            </G>
          );
        })}
      </Svg>
      </Animated.View>
    </View>
  );
}
