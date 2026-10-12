import { useContext } from 'react';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { useTheme } from '@/theme';
import { armPoint, STAGE_GEOMETRY, type Limb } from '../geometry';
import { ArmPoseContext, type LayerProps } from './types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
// Potítko: pásek těsně před koncem paže (stage 1 šířka 4, o 3 širší než paže).
const BAND_W = 4;
const BAND_OVER = 3;

/** Potítka na koncích paží. Kreslí se po ose paže ze stejné pózy jako paže, takže se s celebrate zvedají. */
export function AccWristbands({ anchor, stage }: LayerProps) {
  const pose = useContext(ArmPoseContext);
  const { c } = useTheme();
  if (!pose) return null;
  const g = STAGE_GEOMETRY[stage];
  const len = BAND_W * anchor.scale;
  return (
    <>
      <Band limb={g.armL} side={-1} len={len} color={c.text} raise={pose.raise} upAngle={pose.upAngle} />
      <Band limb={g.armR} side={1} len={len} color={c.text} raise={pose.raise} upAngle={pose.upAngle} />
    </>
  );
}

function Band({ limb, side, len, color, raise, upAngle }: { limb: Limb; side: -1 | 1; len: number; color: string; raise: SharedValue<number>; upAngle: number }) {
  // `raise.value` se čte přímo v updateru (viz Arm v SvgMascot).
  const props = useAnimatedProps(() => {
    const deg = limb.angle + (upAngle - limb.angle) * raise.value;
    const end = limb.h - limb.w / 2;
    const a = armPoint(limb, side, end - len - 1, deg);
    const b = armPoint(limb, side, end - 1, deg);
    return { d: `M${a.x} ${a.y} L${b.x} ${b.y}` };
  });
  return <AnimatedPath stroke={color} strokeWidth={limb.w + BAND_OVER} fill="none" animatedProps={props} />;
}
