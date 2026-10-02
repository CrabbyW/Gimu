import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { MASCOT_SIZES } from '@/components/mascot';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { motion } from '@/lib/motion';
import { glyph, statSize, useTheme, type StatSize } from '@/theme';

// Count-up (UX2): expo.out, čísla naskočí a dojedou. Slam z 1.2 na pružině `motion.slam` (ζ ≈ 0.8).
const COUNT_MS = motion.countMs;
const SLAM_FROM = 1.2;
const easeOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Kombinace velikostí od nejbohatší: číslo je subjekt, opice M má přednost před XL číslem,
 *  pak teprve se zmenšuje opice. Poslední položka je záchrana pro 320 pt a trojciferné XP. */
const FITS: { stat: StatSize; mascot: number }[] = [
  { stat: 'XL', mascot: MASCOT_SIZES.M },
  { stat: 'L', mascot: MASCOT_SIZES.M },
  { stat: 'XL', mascot: MASCOT_SIZES.S },
  { stat: 'L', mascot: MASCOT_SIZES.S },
  { stat: 'M', mascot: MASCOT_SIZES.S },
];

/** Vybere velikost čísla a opice tak, aby se `+total XP` ve slamu (scale 1.2, origin vlevo dole)
 *  vešlo vedle opice bez překryvu. Rozpočítává se z konečné hodnoty (count-up šířku jen zmenšuje). */
export function xpPopFit(total: number, width: number, gap: number): { stat: StatSize; mascot: number } {
  const chars = String(total).length + 1;
  const need = (s: StatSize) => chars * glyph.displayDigit * statSize[s] * SLAM_FROM + glyph.statUnit;
  return FITS.find((f) => need(f.stat) <= width - f.mascot - gap) ?? FITS[FITS.length - 1]!;
}

interface Props {
  total: number;
  /** Rozpis „lekce 20 · první dnes +10“ (velká písmena dělá styl label). */
  breakdown: string;
  /** Okamžik vyskočení; do té doby je místo rezervované a prázdné. */
  shown: boolean;
  /** Omezený pohyb: jen prolnutí, číslo rovnou konečné. */
  calm: boolean;
  /** Šířka obsahu (bez okrajů obrazovky), z ní se volí velikost čísla a opice. */
  width: number;
  /** Svědek vpravo od čísla (opice) v rozpočtené velikosti. */
  aside: (size: number) => ReactNode;
}

/** +XP v oslavě: obří akcentové číslo s count-up, vpravo opice, pod oběma rozpis přes celou šířku. */
export function XpPop({ total, breakdown, shown, calm, width, aside }: Props) {
  const { space } = useTheme();
  const fit = xpPopFit(total, width, space.m);
  const [count, setCount] = useState(calm ? total : 0);
  const scale = useSharedValue(calm ? 1 : SLAM_FROM);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!shown) return;
    if (calm) { opacity.set(withTiming(1, motion.calmFade)); return; }
    // Akcent se nezprůhledňuje (nový odstín): číslo se objeví naráz a vstup nese slam scale.
    opacity.set(1);
    scale.set(withSpring(1, motion.slam));
    let frame = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      start ??= t;
      const p = Math.min(1, (t - start) / COUNT_MS);
      setCount(Math.round(easeOut(p) * total));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, calm, total, opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  // Rozpis se zalamuje jen mezi položkami („první dnes +10“ drží pohromadě).
  const parts = breakdown.split(' · ').map((p) => p.replace(/ /g, ' '));
  return (
    <View accessible accessibilityElementsHidden={!shown} importantForAccessibility={shown ? 'yes' : 'no-hide-descendants'} accessibilityLabel={`+${total} XP, ${breakdown}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.m }}>
        <Animated.View style={[{ flexShrink: 1, transformOrigin: 'left bottom' }, style]}>
          <Stat size={fit.stat} value={`+${count}`} unit="XP" tone="accent" />
        </Animated.View>
        <View pointerEvents="none">{aside(fit.mascot)}</View>
      </View>
      <Animated.View style={[{ marginTop: space.s, flexDirection: 'row', flexWrap: 'wrap' }, fade]}>
        {parts.map((p, i) => (
          <Text key={p} variant="label" tone="muted">{p}{i < parts.length - 1 ? ' · ' : ''}</Text>
        ))}
      </Animated.View>
    </View>
  );
}
