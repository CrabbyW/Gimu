import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> { value: T; label: string }

interface Props<T extends string> { options: readonly SegmentOption<T>[]; value: T | null; onChange(value: T): void }

const BORDER = 1;

/** Přepínač se stejně širokými segmenty. Vybraný je inverzní (pozadí `text`, písmo `base`)
 *  a jeho pozadí se k novému výběru posune v UI timingu. Pozadí nese vlastní kopii popisků
 *  v barvě `base`, posunutou proti němu: během posunu je každé písmeno ostré a kontrastní,
 *  ať leží na pozadí výběru, nebo mimo něj. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { c, radius, space } = useTheme();
  const { reduced } = useMotionSafe();
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.value === value);
  const segment = options.length > 0 ? width / options.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (index < 0 || segment === 0) return;
    const target = index * segment;
    // První umístění (a omezený pohyb) bez animace, ať pozadí nepřijíždí zleva po mountu.
    x.value = placed.current && !reduced ? withTiming(target, motion.ui) : target;
    placed.current = true;
  }, [index, segment, reduced, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const inverseLabels = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));
  const cell = { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s } as const;

  return (
    <View
      accessibilityRole="radiogroup"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - BORDER * 2)}
      style={{ flexDirection: 'row', borderWidth: BORDER, borderColor: c.rule, borderRadius: radius.full, overflow: 'hidden' }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected }}
            style={cell}
          >
            <Text variant="bodyStrong" tone="muted" numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
      {index >= 0 && segment > 0 ? (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={[indicator, { pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, left: 0, width: segment, borderRadius: radius.full, backgroundColor: c.text, overflow: 'hidden' }]}
        >
          <Animated.View style={[inverseLabels, { position: 'absolute', top: 0, bottom: 0, left: 0, width, flexDirection: 'row' }]}>
            {options.map((o) => (
              <View key={o.value} style={cell}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ color: c.base }}>{o.label}</Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}
