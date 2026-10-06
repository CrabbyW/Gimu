import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { useTilePress } from '@/components/ui/useTilePress';
import { copy } from '@/data/copy';
import { opacity, useTheme } from '@/theme';

interface Props {
  selected: boolean;
  onPress(): void;
  accessibilityLabel: string;
  /** `default` = vnitřní okraj `tilePad` 20 (karta cesty), `compact` = 16 (husté seznamy vizí). */
  pad?: 'default' | 'compact';
  /** Glyf vlevo v dané barvě. Kreslí se dvakrát (`muted` a `text` přes sebe) a výběr je prolne. */
  glyph(color: string): ReactNode;
  children: ReactNode;
}

/**
 * Dlaždice volby (Nothing Dot, onboarding a cíle): plocha a vlasová hrana jako `Tile`, výběr = hrana `text`
 * `stroke.focus` přes celý obvod + mono štítek VYBRÁNO. Žádná výplň: inverzní plochu má jen CTA.
 * Štítek má vyhrazený řádek i u nevybrané karty (průhledný), takže výběr nehýbe layoutem.
 * Vlastní Pressable místo `Tile`, protože karta je `radio` se stavem `checked` (Tile je `button`).
 */
export function SelectTile({ selected, onPress, accessibilityLabel, pad = 'default', glyph, children }: Props) {
  const { c, radius, space, size, stroke } = useTheme();
  const box = useRef<View>(null);
  const press = useTilePress(box, opacity.edgeLit);
  // Výběr (motion): hrana `text`, štítek VYBRÁNO a glyf muted → text se prolnou (`useSelectionProgress`,
  // 180 ms výběr / 150 ms zrušení, timing). Omezený pohyb: skok.
  const sel = useSelectionProgress(selected);
  const selStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  const offStyle = useAnimatedStyle(() => ({ opacity: 1 - sel.value }));
  return (
    <Animated.View ref={box} style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, checked: selected }}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: space.m,
          padding: pad === 'compact' ? space.m : size.tilePad,
          minHeight: size.hitLarge,
          backgroundColor: pressed ? c.tilePressed : c.tile,
          borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        })}
      >
        <View>
          <Animated.View style={offStyle}>{glyph(c.muted)}</Animated.View>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, selStyle]}>{glyph(c.text)}</Animated.View>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Animated.View style={selStyle}>
            <Text variant="telemetry" importantForAccessibility="no" accessibilityElementsHidden>
              {copy.onboarding.selected}
            </Text>
          </Animated.View>
          {children}
        </View>
        {/* Hrana výběru přes vlasovou hranu; mimo layout, takže se obsah při výběru neposune. */}
        <Animated.View
          testID={selected ? 'select-edge' : undefined}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: stroke.focus, borderColor: c.text }, selStyle]}
        />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.text }, press.edgeStyle]}
        />
      </Pressable>
    </Animated.View>
  );
}
