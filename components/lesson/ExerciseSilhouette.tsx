import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { DOT, GROUND_Y, SILHOUETTES } from '@/logic/silhouettePoses';
import { useSilhouettePhase } from './useSilhouettePhase';
import { headDotIndex, poseFrame, silhouetteDots } from '@/logic/silhouette';
import { useTheme } from '@/theme';
import type { SilhouetteId } from '@/types';

/** Tečky jako JEDEN Path (kruh = dva oblouky): stovky `Circle` uzlů dusily lekci (QA 548a1a3, lekce 39 fps). */
const dotsPath = (pts: readonly (readonly [number, number])[], r: number): string =>
  pts.map(([x, y]) => `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('');

interface Props {
  id: SilhouetteId;
  /** Fáze pohybu 0–1 (0 = první klíčová póza, 1 = poslední). Statické; smyčku dodává motion.
   *  Při Reduce Motion zůstává 0 = výchozí póza (u výdrže správná poloha, u opakování start). */
  phase?: number;
  /** Bez `phase`: smyčka běží, když `playing` (pauza výdrže / dialog = false). */
  playing?: boolean;
  /** Fáze ven pro mini opičku, která cvičí s tebou ve stejné fázi (sdílená hodnota, bez překreslení rodiče). */
  phaseOut?: SharedValue<number>;
}

/** Tečková postava cviku (Nothing Dot): kosti i hlava z teček v barvě textu, zem jako tečkovaná linka
 *  ve `faint`. Jedno Svg, žádné Skia plátno (rozpočet pláten beze změny). */
export function ExerciseSilhouette({ id, phase, playing = true, phaseOut }: Props) {
  const { c } = useTheme();
  const loop = useSilhouettePhase(SILHOUETTES[id].kind, phase === undefined && playing);
  const t = phase ?? loop;
  // Mini opička (72 pt) stačí na poloviční frekvenci: každá změna fáze překreslí celou její kostru (perf QA d341d87).
  const tick = useRef(0);
  useEffect(() => {
    if (!phaseOut) return;
    tick.current += 1;
    if (tick.current % 2 === 0 || t === 0) phaseOut.set(t);
  }, [t, phaseOut]);
  const vb = poseFrame(id);
  const dots = silhouetteDots(id, t);
  const eye = headDotIndex(dots.length);
  const ground = useMemo(() => {
    const xs: number[] = [];
    for (let x = Math.ceil((vb.x - 200) / DOT.groundPitch) * DOT.groundPitch; x <= vb.x + vb.w + 200; x += DOT.groundPitch) xs.push(x);
    return xs;
  }, [vb.x, vb.w]);
  const groundPath = useMemo(() => dotsPath(ground.map((x) => [x, GROUND_Y + DOT.r] as const), DOT.groundR), [ground]);
  // Dekorativní: Svg na webu atributy přístupnosti propouští do DOM, proto je skrývá obalový View.
  return (
    <View testID={`silhouette-${id}`} style={{ flex: 1, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg aria-hidden width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMax meet">
        <Path testID="silhouette-ground" d={groundPath} fill={c.faint} />
        <Path testID="silhouette-figure" d={dotsPath(dots.filter((_, i) => i !== eye), DOT.r)} fill={c.text} />
        {dots[eye] ? <Circle testID="silhouette-eye" cx={dots[eye][0]} cy={dots[eye][1]} r={DOT.r} fill={c.live} /> : null}
      </Svg>
    </View>
  );
}
