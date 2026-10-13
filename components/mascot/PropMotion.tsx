import { createContext, useContext, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { G } from 'react-native-svg';
import { partMatrix, propPart } from '@/lib/poseMotion';
import { actProp, followsHand, handFollow } from '@/lib/repertoireMotion';

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
  /** Akce repertoáru: kód (`ACT_CODE`, −1 = nic) a osa 0–1 (nacvaknutí kotouče, plamen, hodinky…). */
  actCode?: SharedValue<number>;
  actT?: SharedValue<number>;
  /** Živá kostra a statická cílová póza: rekvizita v ruce jde s dlaní (činka, lahev, hodinky). */
  live?: SharedValue<number[]>;
  target?: SharedValue<number[]>;
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
  const fallback = useSharedValue(-1);
  const none = useSharedValue<number[]>([]);
  const actCode = m.actCode ?? fallback;
  const actT = m.actT ?? fallback;
  const live = m.live ?? none;
  const target = m.target ?? none;
  const animatedProps = useAnimatedProps(() => {
    const c = code.value;
    const f = propPart(c, i, n, clock.value, on, entry.value);
    // Akce: úhly a posuny se sčítají, měřítka a krytí násobí; rekvizita v ruce jde s dlaní.
    const a = actProp(actCode.value, actT.value, c, i, n);
    const h = on > 0 && followsHand(c, i) && live.value.length > 0 ? handFollow(c, live.value, target.value) : [0, 0];
    return {
      opacity: (f[5] ?? 1) * (a[5] ?? 1),
      ...partMatrix((f[0] ?? 0) + (a[0] ?? 0), (f[1] ?? 1) * (a[1] ?? 1), (f[2] ?? 1) * (a[2] ?? 1), cx, cy,
        (f[3] ?? 0) + (a[3] ?? 0) + (h[0] ?? 0), (f[4] ?? 0) + (a[4] ?? 0) + (h[1] ?? 0), IS_WEB),
    };
  });
  return <AnimatedG animatedProps={animatedProps}>{children}</AnimatedG>;
}
