import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useTilePress } from '@/components/ui/useTilePress';
import { copy } from '@/data/copy';
import { opacity, useTheme } from '@/theme';

interface Props {
  selected: boolean;
  onPress(): void;
  accessibilityLabel: string;
  /** `default` = vnitřní okraj `tilePad` 20 (karta cesty), `compact` = 16 (husté seznamy vizí). */
  pad?: 'default' | 'compact';
  /** Glyf vlevo (už obarvený volajícím podle `selected`). */
  glyph: ReactNode;
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
        {glyph}
        <View style={{ flex: 1, gap: space.xs }}>
          <Text
            variant="telemetry"
            importantForAccessibility="no"
            accessibilityElementsHidden
            style={{ opacity: selected ? 1 : 0 }}
          >
            {copy.onboarding.selected}
          </Text>
          {children}
        </View>
        {/* Hrana výběru přes vlasovou hranu; mimo layout, takže se obsah při výběru neposune. */}
        {selected ? (
          <View
            testID="select-edge"
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: stroke.focus, borderColor: c.text }]}
          />
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.text }, press.edgeStyle]}
        />
      </Pressable>
    </Animated.View>
  );
}
