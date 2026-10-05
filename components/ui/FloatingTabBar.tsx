import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { layout, useTheme } from '@/theme';
import { Text } from './Text';

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
 */
export function FloatingTabBar({ state, descriptors, navigation, insets, padStyle }: Props) {
  const { c, space, size, radius } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const [barW, setBarW] = useState(screenW - space.m * 2);
  const count = state.routes.length;
  const inner = space.xs;
  const slot = (barW - inner * 2) / Math.max(1, count);
  const showLabel = screenW >= layout.narrow;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.m, paddingBottom: insets.bottom + space.m }}
    >
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
            position: 'absolute', top: inner, bottom: inner, left: inner + state.index * slot, width: slot,
            borderRadius: radius.full, backgroundColor: c.tilePressed,
          }, padStyle]}
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
              {options.tabBarIcon?.({ focused, color, size: size.tabIcon })}
              {focused && showLabel ? (
                <Text variant="tabLabelCompact" numberOfLines={1} importantForAccessibility="no" style={{ color }}>{title}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
