import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { opacity, useTheme } from '@/theme';

export interface TileProps {
  children?: ReactNode;
  /** S `onPress` je dlaždice tlačítko (stisk = `tilePressed` + rozjasněná hrana); bez něj statická plocha. */
  onPress?(): void;
  /** Bod dotyku pro 3D naklopení (motion-agent: `motion.tilePress`, rotateX/rotateY k prstu). */
  onPressIn?(e: GestureResponderEvent): void;
  onPressOut?(e: GestureResponderEvent): void;
  /** `tile` (výchozí, widget na podkladu), `base` (buňka uvnitř dlaždice), `raised` (o tón výš, zvýraznění). */
  tone?: 'tile' | 'base' | 'raised';
  /** Vnitřní okraj: `tilePad` 20 (výchozí), `compact` 16 pro husté seznamy, `none` pro plnoplošný obsah (pole teček). */
  pad?: 'default' | 'compact' | 'none';
  /** Animovaný styl z motion vrstvy (scale, naklopení); staticky nic. */
  motionStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Dlaždice-widget (spec §2.3, obr. 2): radius 28, padding 20, plocha `tile` a jediné oddělení vlasovou hranou
 * `edge`. Žádný stín: hloubku dělá tón, ne efekt. Layout obsahu (číslo nahoře, název dole) skládá volající.
 */
export function Tile({ children, onPress, onPressIn, onPressOut, tone = 'tile', pad = 'default', motionStyle, style, accessibilityLabel, accessibilityHint }: TileProps) {
  const { c, radius, space, size } = useTheme();
  const padding = pad === 'none' ? 0 : pad === 'compact' ? space.m : size.tilePad;
  const surface = (pressed: boolean): ViewStyle => ({
    backgroundColor: pressed || tone === 'raised' ? c.tilePressed : c[tone],
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.edge,
    padding,
    overflow: 'hidden',
  });
  if (!onPress) {
    return <View style={[surface(false), style]}>{children}</View>;
  }
  return (
    <Animated.View style={motionStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [surface(pressed), style]}
      >
        {({ pressed }) => (
          <>
            {children}
            {/* Rozjasněná hrana ve stisku: vrstva `text` přes `edge`, bez barevné aritmetiky. */}
            {pressed ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.text, opacity: opacity.edgeLit }]}
              />
            ) : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
