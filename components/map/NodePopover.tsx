import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import { useTheme } from '@/theme';

export const POPOVER_W = 296;
const ARROW = 14;
const GAP = 12;
const EDGE = 16;
const CLOSE_ICON = 20;

interface Props {
  title: string;
  /** Odhad délky lekce (`estMinutes`). */
  minutes: number;
  exerciseCount: number;
  xp: number;
  state: NodeState;
  /** Střed uzlu a jeho výška v souřadnicích mapy. */
  anchor: { x: number; y: number; h: number };
  /** Popover nad uzlem (když by pod ním přetekl konec mapy). */
  above: boolean;
  mapWidth: number;
  mapHeight: number;
  onStart(): void;
  /** Zavření: vlastní tlačítko a VoiceOver escape (modální karta nesmí uvěznit fokus). */
  onClose(): void;
}

/** Karta k uzlu: název, kg · cviky · XP a akce. Otevírá se timingem (UI), bez pružiny. */
export function NodePopover({ title, minutes, exerciseCount, xp, state, anchor, above, mapWidth, mapHeight, onStart, onClose }: Props) {
  const { c, space, radius, size } = useTheme();
  const CLOSE_HIT = size.hit;
  const { reduced } = useMotionSafe();
  const open = useSharedValue(0);
  useEffect(() => { open.value = withTiming(1, motion.ui); }, [open]);
  // UX2: popover vyroste z uzlu (scale 0.94 → 1 od hrany u šipky) a přisune se k němu o 8 pt, 180 ms ease-out.
  const toward = above ? 1 : -1;
  const style = useAnimatedStyle(() => ({
    opacity: open.value,
    transform: reduced ? [] : [{ translateY: toward * motion.popover.shift * (1 - open.value) }, { scale: motion.popover.from + (1 - motion.popover.from) * open.value }],
  }));

  const width = Math.min(POPOVER_W, mapWidth - EDGE * 2);
  const left = Math.min(Math.max(anchor.x - width / 2, EDGE), mapWidth - EDGE - width);
  const edgeY = above ? anchor.y - anchor.h / 2 - GAP : anchor.y + anchor.h / 2 + GAP;
  const arrowLeft = Math.min(Math.max(anchor.x - left - ARROW / 2, radius.l), width - radius.l - ARROW);

  return (
    <Animated.View
      // Zachytí tap, aby neprošel na podklad, který popover zavírá.
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
      onAccessibilityEscape={onClose}
      style={[
        { position: 'absolute', zIndex: 3, left, width, transformOrigin: above ? 'bottom' : 'top' },
        above ? { bottom: mapHeight - edgeY } : { top: edgeY },
        style,
      ]}
    >
      <View style={{ backgroundColor: c.raised, borderRadius: radius.l, padding: space.m, gap: space.s, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.edge }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s }}>
          <Text variant="headline" numberOfLines={2} style={{ flex: 1 }}>{title}</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.map.closePopover}
            hitSlop={(CLOSE_HIT - CLOSE_ICON) / 2}
            style={{ marginTop: space.xs }}
          >
            <X size={CLOSE_ICON} color={c.muted} strokeWidth={1.5} />
          </Pressable>
        </View>
        <Text variant="caption" tone="muted">{`${copy.map.nodeInfo(exerciseCount, minutes)} · ${copy.map.xpGain(xp)}`}</Text>
        {state === 'locked' ? (
          <Text tone="muted" style={{ marginTop: space.xs }} accessibilityRole="alert">{copy.map.locked}</Text>
        ) : (
          <Button
            label={state === 'done' ? copy.map.replayLesson : copy.map.startLesson}
            variant={state === 'done' ? 'secondary' : 'primary'}
            onPress={onStart}
            style={{ marginTop: space.s }}
          />
        )}
      </View>
      <View
        style={{
          position: 'absolute', left: arrowLeft, width: ARROW, height: ARROW, backgroundColor: c.raised,
          transform: [{ rotate: '45deg' }], ...(above ? { bottom: -ARROW / 2 } : { top: -ARROW / 2 }),
        }}
      />
    </Animated.View>
  );
}
