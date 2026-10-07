import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ease, lineBubble as LB, useMotionSafe } from '@/lib/motion';
import { LineBubble } from './LineBubble';

const NEVER = { reduceMotion: ReduceMotion.Never };

interface Props {
  /** Aktuální replika; `null` = odchod (bublina se dopřehraje a pak odpojí, nikdy nezmizí skokem). */
  text: string | null;
  arrowX?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pohyb repliky (motion-agent): vstup z hrotu (fade + posun + scale, origin = hrot), odchod rychlejší.
 * Další ťuknutí za běhu jen vymění text (bez blikání); ťuknutí během odchodu ho otočí zpět do nástupu.
 * Omezený pohyb: jen prolnutí. Stav je hned (text drží `useMascotLine`), animace ho jen znázorní.
 */
export function LineBubbleMotion({ text, arrowX, style }: Props) {
  const { reduced } = useMotionSafe();
  const [shown, setShown] = useState<string | null>(text);
  const v = useSharedValue(0);
  const calm = useSharedValue(reduced ? 1 : 0);
  calm.value = reduced ? 1 : 0;

  // Text drží poslední repliku, dokud odchod nedoběhne (odvozeno při renderu, ne efektem).
  if (text !== null && text !== shown) setShown(text);

  useEffect(() => {
    cancelAnimation(v);
    if (text !== null) {
      v.value = withTiming(1, { duration: LB.inMs, easing: ease.out, ...NEVER });
      return;
    }
    v.value = withTiming(0, { duration: LB.outMs, easing: ease.exit, ...NEVER }, (done) => {
      if (done) scheduleOnRN(setShown, null);
    });
  }, [text, v]);

  const anim = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, v.value));
    if (calm.value === 1) return { opacity: p, transform: [{ translateY: 0 }, { scale: 1 }] };
    return { opacity: p, transform: [{ translateY: (1 - p) * LB.rise }, { scale: LB.fromScale + (1 - LB.fromScale) * p }] };
  });

  if (shown === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      testID="mascot-line"
      style={[style, { transformOrigin: [arrowX ?? '50%', '100%', 0] }, anim]}
    >
      <LineBubble text={shown} arrowX={arrowX} />
    </Animated.View>
  );
}
