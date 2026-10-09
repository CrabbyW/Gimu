import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DOT, GROUND_Y } from '@/logic/silhouettePoses';
import { poseFrame, silhouetteDots } from '@/logic/silhouette';
import { useTheme } from '@/theme';
import type { SilhouetteId } from '@/types';

interface Props {
  id: SilhouetteId;
  /** Fáze pohybu 0–1 (0 = první klíčová póza, 1 = poslední). Statické; smyčku dodává motion.
   *  Při Reduce Motion zůstává 0 = výchozí póza (u výdrže správná poloha, u opakování start). */
  phase?: number;
}

/** Tečková postava cviku (Nothing Dot): kosti i hlava z teček v barvě textu, zem jako tečkovaná linka
 *  ve `faint`. Jedno Svg, žádné Skia plátno (rozpočet pláten beze změny). */
export function ExerciseSilhouette({ id, phase = 0 }: Props) {
  const { c } = useTheme();
  const vb = poseFrame(id);
  const dots = silhouetteDots(id, phase);
  const ground = useMemo(() => {
    const xs: number[] = [];
    for (let x = Math.ceil((vb.x - 200) / DOT.groundPitch) * DOT.groundPitch; x <= vb.x + vb.w + 200; x += DOT.groundPitch) xs.push(x);
    return xs;
  }, [vb.x, vb.w]);
  // Dekorativní: Svg na webu atributy přístupnosti propouští do DOM, proto je skrývá obalový View.
  return (
    <View testID={`silhouette-${id}`} style={{ flex: 1, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg aria-hidden width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMax meet">
        {ground.map((x) => <Circle key={`g${x}`} cx={x} cy={GROUND_Y + DOT.r} r={DOT.groundR} fill={c.faint} />)}
        {dots.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={DOT.r} fill={c.text} />)}
      </Svg>
    </View>
  );
}
