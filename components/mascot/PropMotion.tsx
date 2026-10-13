import { createContext, useContext, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { G } from 'react-native-svg';
import { partMatrix, propPart } from '@/lib/poseMotion';

const AnimatedG = Animated.createAnimatedComponent(G);
const IS_WEB = Platform.OS === 'web';

/**
 * Pohyb rekvizit póz (motion-agent): `SvgMascot` poskytne sdílené hodnoty živé smyčky, `PoseProps` obalí
 * pohyblivé části do `<PropPart>`. Pohyb počítá worklet `propPart` (`lib/poseMotion`) jen z čísel
 * a sdílených hodnot (pravidlo `local/no-worklet-object-capture`).
 */
export interface PropMotionValues {
  /** Hodina živé smyčky 0–1 za `LIFE_CLOCK_MS`. */
  clock: SharedValue<number>;
  /** Kód cílové pózy (`POSE_CODE`). */
  code: SharedValue<number>;
  /** Náběh pózy 0 → 1 (dokreslení po tečkách). */
  entry: SharedValue<number>;
  /** 1 = živá smyčka, 0 = omezený pohyb / statická galerie. */
  on: number;
}

export const PropMotionContext = createContext<PropMotionValues | null>(null);

interface PartProps {
  /** Index části a počet částí rekvizity. */
  i: number;
  n: number;
  /** Pivot rotace a měřítka (viewBox). */
  cx: number;
  cy: number;
  children: ReactNode;
}

/** Pohyblivá část rekvizity. Bez kontextu (statická kresba) jen obyčejná skupina. */
export function PropPart(props: PartProps) {
  const m = useContext(PropMotionContext);
  if (!m) return <G>{props.children}</G>;
  return <LivePart {...props} m={m} />;
}

function LivePart({ i, n, cx, cy, children, m }: PartProps & { m: PropMotionValues }) {
  const { clock, code, entry } = m;
  const on = m.on;
  const animatedProps = useAnimatedProps(() => {
    const f = propPart(code.value, i, n, clock.value, on, entry.value);
    return { opacity: f[5] ?? 1, ...partMatrix(f[0] ?? 0, f[1] ?? 1, f[2] ?? 1, cx, cy, f[3] ?? 0, f[4] ?? 0, IS_WEB) };
  });
  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
}
