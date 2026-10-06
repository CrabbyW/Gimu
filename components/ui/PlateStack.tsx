import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { DotPlate } from '@/components/dots';
import { useReveal } from '@/components/ui/choreo';
import { motion, useMotionSafe } from '@/lib/motion';
import { dots, useTheme } from '@/theme';

interface Props {
  /** Nástup: stoh vyroste z podlahy (výřez o výšce stohu, obsah vyjede zdola). Bez `play` stojí hned. */
  play?: boolean;
  /** ms od začátku sledu obrazovky. */
  delay?: number;
}

/** Výška stohu v pt (pro kotvení opičky nad ním): spodní elipsa + dva rozestupy. */
export function plateStackHeight() {
  const P = dots.pedestal;
  return P.sizes[0] * P.squash + P.step * (P.sizes.length - 1);
}

/**
 * Podstavec profilu (Nothing Dot fáze 2): stoh tří tečkových kotoučů `DotPlate` (stav `done`, bez rotace,
 * dekorativní) zploštělých přes `scaleY` na elipsy, jako kotouče na zemi viděné mírně shora. Těžší dole
 * (víc prstenců). Každá elipsa má pod sebou plochu `base`: vyšší kotouč zakryje střed nižšího, takže stoh
 * čte jako pevná hmota, ne jako průhledné prstence přes sebe. 3 plátna.
 */
export function PlateStack({ play = false, delay = 0 }: Props) {
  const { c, radius } = useTheme();
  const P = dots.pedestal;
  const H = plateStackHeight();
  const W = P.sizes[0];
  // Motion (polish 2026-10-05): růst z podlahy = posun o celou výšku ve výřezu, 480 ms ease.out (UI vlákno).
  // Omezený pohyb: useReveal dá 200ms prolnutí, posun 0.
  const { reduced } = useMotionSafe();
  const t = useReveal(play, delay, motion.reveal);
  const dy = reduced ? 0 : H;
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * dy }] }));
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: W, height: H, overflow: 'hidden' }}>
      <Animated.View style={[{ width: W, height: H }, a]}>
        {/* Kreslí se zdola nahoru: pozdější (menší, výš) kotouč leží přes předchozí. */}
        {P.sizes.map((d, k) => {
          const cy = H - (W * P.squash) / 2 - k * P.step;
          return (
            <View
              key={d}
              style={{
                position: 'absolute', left: (W - d) / 2, top: cy - d / 2, width: d, height: d,
                borderRadius: radius.full, backgroundColor: c.base, transform: [{ scaleY: P.squash }],
              }}
            >
              <DotPlate kg={P.kg[k] ?? P.kg[P.kg.length - 1]!} size={d} state="done" showKg={false} check={false} decorative />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}
