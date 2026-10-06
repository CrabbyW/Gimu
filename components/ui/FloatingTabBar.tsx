import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from '@/lib/haptics';
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
 * Přejetí prstem po pilulce: podložka jede plynule za prstem, na každém slotu jemný haptický tik; po puštění
 * se přepne na tab pod prstem (stejný `tabPress` jako tap, takže guard i haptika) a podložka dosedne.
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

  // Skutečně aktivní tab (i hned po `navigate`, než přijde nový `state`): po puštění na něj podložka dosedne,
  // i když guard navigace (`lib/navGuard`) přepnutí během přejíždění zablokoval.
  const active = useSharedValue(state.index);
  const goTo = useCallback((i: number) => {
    const route = state.routes[i];
    if (!route || i === state.index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) { navigation.navigate(route.name, route.params); active.set(i); }
  }, [navigation, state.routes, state.index, active]);
  const hovered = useSharedValue(state.index);
  useEffect(() => { active.set(state.index); hovered.set(state.index); }, [state.index, hovered, active]);
  const settle = useCallback(() => {
    const target = active.get() * slot;
    hovered.set(active.get());
    x.set(reduced ? target : withTiming(target, { duration: motion.tabSlideMs, easing: easeSafe.out }));
  }, [slot, reduced, x, hovered, active]);
  // Puštění prstu: přepne na tab pod prstem (jedno `navigate`, ne obrazovka po obrazovce během tahu)
  // a podložka dosedne; když guard přepnutí zablokuje, dosedne zpět na aktivní tab.
  const release = useCallback((i: number) => { goTo(i); settle(); }, [goTo, settle]);
  const scrub = useMemo(() => Gesture.Pan()
    // Krátký vodorovný posun, ať tap na ikonu zůstane tapem.
    .activeOffsetX([-motion.tabScrub.activeOffset, motion.tabScrub.activeOffset])
    .onStart(() => { dragging.set(true); })
    .onUpdate((e) => {
      // Podložka jede plynule za prstem; přechod přes slot = jemný haptický tik, obrazovka se zatím nemění.
      const maxX = (count - 1) * slot;
      x.set(Math.min(maxX, Math.max(0, e.x - inner - slot / 2)));
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - inner) / slot)));
      if (i !== hovered.get()) { hovered.set(i); scheduleOnRN(haptics.tick); }
    })
    .onEnd(() => { scheduleOnRN(release, hovered.get()); })
    .onFinalize((_e, success) => {
      dragging.set(false);
      if (!success) scheduleOnRN(settle);
    }), [count, slot, inner, x, hovered, dragging, release, settle]);
  // Ťuknutí vyhodnocuje stejný GestureDetector jako tah (RNGH Tap, ne Pressable): na iPhonu Pan zachytil
  // první dotek a Pressable dostal až druhé ťuknutí („musím 2× poklepat“). Tab = slot pod prstem.
  const tapTo = useCallback((i: number) => {
    const route = state.routes[i];
    if (!route) return;
    if (i === state.index) { navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); return; }
    release(i);
  }, [state.routes, state.index, navigation, release]);
  const tap = useMemo(() => Gesture.Tap()
    .onEnd((e, success) => {
      if (!success) return;
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - inner) / slot)));
      scheduleOnRN(tapTo, i);
    }), [count, slot, inner, tapTo]);
  const gesture = useMemo(() => Gesture.Race(scrub, tap), [scrub, tap]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.m, paddingBottom: insets.bottom + space.m }}
    >
      <GestureDetector gesture={gesture}>
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
          return (
            // Dotyk řeší gesto lišty (tap + tah); View nese jen přístupnost (aktivace čtečkou → tapTo).
            <View
              key={route.key}
              accessible
              onAccessibilityTap={() => tapTo(i)}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'activate') tapTo(i); }}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
              accessibilityState={{ selected: focused }}
              aria-selected={focused}
              style={{ flex: 1, height: size.tabPill - inner * 2, alignItems: 'center', justifyContent: 'center', gap: space.xs / 2 }}
            >
              {/* Jen ikona (obr. 2): popisek „TRÉNINK“ se do kulaté podložky nevejde; název nese čtečka. */}
              {options.tabBarIcon?.({ focused, color, size: size.tabIcon })}
            </View>
          );
        })}
      </View>
      </GestureDetector>
    </View>
  );
}
