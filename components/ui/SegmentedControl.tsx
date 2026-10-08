import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> { value: T; label: string }

interface Props<T extends string> {
  options: readonly SegmentOption<T>[]; value: T | null; onChange(value: T): void;
  /** Hlasitý název skupiny (otázka ano/ne): čtečka ho přečte před volbami. */
  label?: string;
}

/** Hrana pilulky: vlasová, jako dlaždice. */
const BORDER = StyleSheet.hairlineWidth;

/**
 * Přepínač v pilulce (Nothing Dot §2.3): vnější pilulka `tile` s vlasovou hranou `edge`, uvnitř o `space.xs`
 * odsazená vybraná pilulka s výplní `text` a popiskem `onText` (stejná inverze jako primární CTA).
 * Celková výška `size.control` + 2 × `space.xs` = 56 = `size.pill`, takže sedí v řadě s pilulkovými tlačítky.
 * Výběr se k nové volbě posune v UI timingu. Pozadí nese vlastní kopii popisků posunutou proti němu:
 * během posunu je každé písmeno ostré a kontrastní, ať leží na výběru, nebo mimo něj.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: Props<T>) {
  const { c, radius, space, size } = useTheme();
  const { reduced } = useMotionSafe();
  const inset = space.xs;
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
  // Čtyři volby na 320 pt (jednotky milníku) mají buňku ~60 pt: popisek se smí zmenšit, ne oříznout.
  const cell = { flex: 1, minHeight: size.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs } as const;
  const fit = { numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: 0.8 } as const;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - (BORDER + inset) * 2)}
      style={{ flexDirection: 'row', padding: inset, backgroundColor: c.tile, borderWidth: BORDER, borderColor: c.edge, borderRadius: radius.full }}
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
            style={({ pressed }) => [cell, { borderRadius: radius.full, backgroundColor: pressed && !selected ? c.tilePressed : 'transparent' }]}
          >
            <Text variant="bodyStrong" tone="muted" {...fit}>{o.label}</Text>
          </Pressable>
        );
      })}
      {index >= 0 && segment > 0 ? (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={[indicator, { pointerEvents: 'none', position: 'absolute', top: inset, bottom: inset, left: inset, width: segment, borderRadius: radius.full, backgroundColor: c.text, overflow: 'hidden' }]}
        >
          <Animated.View style={[inverseLabels, { position: 'absolute', top: 0, bottom: 0, left: 0, width, flexDirection: 'row' }]}>
            {options.map((o) => (
              <View key={o.value} style={cell}>
                <Text variant="bodyStrong" {...fit} style={{ color: c.onText }}>{o.label}</Text>
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}
