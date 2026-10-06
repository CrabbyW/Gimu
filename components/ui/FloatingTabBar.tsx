import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { easeSafe, motion, useMotionSafe } from '@/lib/motion';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useTheme } from '@/theme';

interface Props extends BottomTabBarProps {
  /** Animovaný styl aktivní podložky (motion-agent: posun `left` za `motion.tabSlideMs`). Staticky stojí pod aktivním tabem. */
  padStyle?: StyleProp<ViewStyle>;
}

/** Spodní odsazení obsahu tabů, aby plovoucí pilulka nic nepřekryla: pilulka + mezera nad ní + safe area. */
export const tabBarClearance = (bottomInset: number, pill: number, gap: number) => pill + gap * 2 + bottomInset;

/**
 * Plovoucí tab bar (spec §2.3, obr. 2): pilulka `tile` + vlasová hrana, výška 64, 16 od okrajů a nad safe area.
 * Aktivní tab = podložka `tilePressed` (absolutně, pod ikonou) + ikona `text`; ostatní `muted`.
 * Popisek jen u aktivního tabu (mono 10) a jen od šířky 360 pt; pod ní samé ikony (popisek nese čtečka).
 * Tap emituje `tabPress` (guard navigace a haptika žijí ve `screenListeners` layoutu).
 * Přejetí prstem po pilulce: podložka jede za prstem a tab se přepne hned, jak prst přejede do jiného slotu
 * (stejný `tabPress`, takže i haptika a guard); po puštění podložka dosedne na slot.
 */
export function FloatingTabBar({ state, descriptors, navigation, insets, padStyle }: Props) {
  const { c, space, size, radius } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const [barW, setBarW] = useState(screenW - space.m * 2);
  const count = state.routes.length;
  const inner = space.xs;
  const slot = (barW - inner * 2) / Math.max(1, count);
  const padD = Math.min(slot, size.tabPill - inner * 2);
  // Podložka klouže za aktivním tabem (`motion.tabSlideMs`, ease.out, bez pružiny). Posun přes translateX
  // na UI vlákně; změna šířky lišty (rotace, první layout) ji přestaví bez animace.
  const { reduced } = useMotionSafe();
  const x = useSharedValue(state.index * slot);
  const lastSlot = useRef(slot);
  const dragging = useSharedValue(false);
  useEffect(() => {
    const target = state.index * slot;
    // Při přejíždění prstem vede podložku prst, ne změna tabu.
    if (dragging.get()) return;
    if (lastSlot.current !== slot || reduced) { lastSlot.current = slot; x.set(target); return; }
    x.set(withTiming(target, { duration: motion.tabSlideMs, easing: easeSafe.out }));
  }, [state.index, slot, reduced, x, dragging]);

  const goTo = useCallback((i: number) => {
    const route = state.routes[i];
    if (!route || i === state.index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
  }, [navigation, state.routes, state.index]);
  const hovered = useSharedValue(state.index);
  useEffect(() => { hovered.set(state.index); }, [state.index, hovered]);
  const scrub = useMemo(() => Gesture.Pan()
    // Krátký vodorovný posun, ať tap na ikonu zůstane tapem.
    .activeOffsetX([-motion.tabScrub.activeOffset, motion.tabScrub.activeOffset])
    .onStart(() => { dragging.set(true); })
    .onUpdate((e) => {
      const maxX = (count - 1) * slot;
      x.set(Math.min(maxX, Math.max(0, e.x - inner - slot / 2)));
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - inner) / slot)));
      if (i !== hovered.get()) { hovered.set(i); scheduleOnRN(goTo, i); }
    })
    .onFinalize(() => {
      dragging.set(false);
      x.set(reduced ? hovered.get() * slot : withTiming(hovered.get() * slot, { duration: motion.tabSlideMs, easing: easeSafe.out }));
    }), [count, slot, inner, x, hovered, dragging, goTo, reduced]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.m, paddingBottom: insets.bottom + space.m }}
    >
      <GestureDetector gesture={scrub}>
      <View
        accessibilityRole="tablist"
        onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
        style={{
          height: size.tabPill, borderRadius: size.tabPill / 2, backgroundColor: c.tile,
          borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge, flexDirection: 'row', alignItems: 'center', paddingHorizontal: inner,
        }}
      >
        <Animated.View
          testID="tab-pad"
          pointerEvents="none"
          style={[{
            // Kulatá podložka pevného průměru, vystředěná ve slotu (ne přes celou šířku slotu, ta u krajů
            // narážela do zaoblení pilulky a opticky ujížděla).
            position: 'absolute', top: inner, left: inner + (slot - padD) / 2, width: padD, height: padD,
            borderRadius: radius.full, backgroundColor: c.tilePressed,
          }, slide, padStyle]}
        />
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key]!;
          const focused = state.index === i;
          const title = options.title ?? route.name;
          const color = focused ? c.text : c.muted;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
              accessibilityState={{ selected: focused }}
              style={{ flex: 1, height: size.tabPill - inner * 2, alignItems: 'center', justifyContent: 'center', gap: space.xs / 2 }}
            >
              {/* Jen ikona (obr. 2): popisek „TRÉNINK“ se do kulaté podložky nevejde; název nese čtečka. */}
              {options.tabBarIcon?.({ focused, color, size: size.tabIcon })}
            </Pressable>
          );
        })}
      </View>
      </GestureDetector>
    </View>
  );
}
