import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { copy } from '@/data/copy';
import { fitCell, textDots } from '@/logic/dotGlyphs';
import { dots as dotTokens, useTheme } from '@/theme';

export interface DotIntroProps {
  /** Postup rozsvícení 0–1 zleva doprava (sloupec `col` svítí, když `col < progress × cols`). Výchozí 1 = celý nápis.
   *  Motion-agent sem napojí čas (nebo obalí sloupce animovaným stylem přes `testID` `intro-col-<n>`). */
  progress?: number;
  /** Konec intra: ťuknutí (skip) nebo dohrání animace. Volá ho rodič/motion, komponenta sama jen při skipu. */
  onDone: () => void;
  /** Text nápisu; výchozí OPICE. */
  text?: string;
}

/**
 * Logo moment při studeném startu: mřížka teček s nápisem OPICE uprostřed podkladu.
 * RN View, ne Skia: intro se ukáže hned při startu, kdy na webu ještě není načtený CanvasKit (8 MB wasm),
 * a nezabírá žádné z ≤ 12 WebGL pláten. Tečky jsou seskupené po sloupcích (29 View), takže
 * rozsvícení zleva doprava = 29 animovaných stylů, ne 203.
 */
export function DotIntro({ progress = 1, onDone, text = 'OPICE' }: DotIntroProps) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => textDots(text), [text]);
  const cell = fitCell(layout.cols, width * dotTokens.intro.widthFrac, dotTokens.intro.maxCell);
  const d = Math.max(1, Math.round(cell * dotTokens.intro.dotFrac));
  const columns = useMemo(() => {
    const lit = Array.from({ length: layout.cols }, () => new Set<number>());
    for (const p of layout.dots) lit[p.x]?.add(p.y);
    return lit;
  }, [layout]);
  const litCols = progress * layout.cols;

  return (
    <Pressable
      testID="dot-intro"
      onPress={onDone}
      accessible
      accessibilityRole="button"
      accessibilityLabel={copy.intro.label}
      accessibilityHint={copy.intro.hint}
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.base }]}
    >
      <View
        testID="intro-word"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.row, { width: cell * layout.cols, height: cell * layout.rows }]}
      >
        {columns.map((ys, col) => (
          <View key={col} testID={`intro-col-${col}`} style={{ width: cell }}>
            {Array.from({ length: layout.rows }, (_, y) => (
              <View key={y} style={[styles.center, { width: cell, height: cell }]}>
                <View
                  testID={ys.has(y) ? 'intro-dot-on' : undefined}
                  style={{
                    width: d, height: d, borderRadius: d / 2,
                    backgroundColor: ys.has(y) && col < litCols ? c.text : c.dotOff,
                  }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
});
