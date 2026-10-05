import { useRef, type RefObject } from 'react';
import type { GestureResponderEvent, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { easeSafe, motion, useMotionSafe } from '@/lib/motion';

const P = motion.tilePress;
const RELEASE = { duration: P.releaseMs, easing: easeSafe.out };
const PRESS = { duration: motion.press.duration, easing: easeSafe.press };

/** Naklopení k bodu dotyku: bod (x, y) v dlaždici w × h → rotateX/rotateY ve stupních (max `max`).
 *  Okraj, na který prst tlačí, jde „dolů“ (od diváka): vpravo = rotateY kladné, nahoře = rotateX kladné. */
export function tiltAt(x: number, y: number, w: number, h: number, max: number): { rx: number; ry: number } {
  'worklet';
  if (w <= 0 || h <= 0) return { rx: 0, ry: 0 };
  const nx = Math.max(-1, Math.min(1, (x / w) * 2 - 1));
  const ny = Math.max(-1, Math.min(1, (y / h) * 2 - 1));
  return { rx: -ny * max, ry: nx * max };
}

/**
 * Stisk dlaždice (spec §3): scale 0.97 + 3D naklopení k bodu dotyku (max 6°, perspective 600) a rozjasnění
 * hrany; stisk `motion.press` (90 ms), puštění `tilePress.releaseMs` ease.out. Žádná pružina (klikatelné).
 * Vše na UI vlákně. Omezený pohyb: jen rozjasnění hrany (bez scale a naklopení).
 */
export function useTilePress(ref: RefObject<View | null>, edgeMax = 1) {
  const { reduced } = useMotionSafe();
  const pressed = useSharedValue(0);
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const down = useRef(false);
  const style = useAnimatedStyle(() => (reduced ? {} : {
    transform: [
      { perspective: P.perspective },
      { scale: 1 - pressed.value * (1 - P.scale) },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
    ],
  }));
  const edgeStyle = useAnimatedStyle(() => ({ opacity: pressed.value * edgeMax }));
  return {
    style,
    edgeStyle,
    onPressIn: (e: GestureResponderEvent) => {
      down.current = true;
      pressed.value = withTiming(1, PRESS);
      if (reduced) return;
      // Bod dotyku vůči celé dlaždici (locationX je vůči vnořenému prvku pod prstem, proto pageX − poloha dlaždice).
      const { pageX, pageY } = e.nativeEvent;
      ref.current?.measure((_x, _y, w, h, left, top) => {
        if (!down.current) return; // puštěno dřív, než přišlo měření: nenaklápět
        const t = tiltAt(pageX - left, pageY - top, w, h, P.tiltMaxDeg);
        rx.value = withTiming(t.rx, PRESS);
        ry.value = withTiming(t.ry, PRESS);
      });
    },
    onPressOut: () => {
      down.current = false;
      pressed.value = withTiming(0, RELEASE);
      rx.value = withTiming(0, RELEASE);
      ry.value = withTiming(0, RELEASE);
    },
  };
}
