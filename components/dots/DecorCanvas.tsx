import { Canvas, type CanvasProps } from '@shopify/react-native-skia';
import { View } from 'react-native';

const FILL = { width: '100%', height: '100%' } as const;

/** Dekorativní Skia plátno (elite fáze 4, VoiceOver): obal skrytý pro čtečku na nativu i webu
 *  (Skia na webu `aria-hidden` z plátna nepropíše). Geometrie a `pointerEvents` jdou na obal, plátno ho vyplní. */
export function DecorCanvas({ style, pointerEvents, children, testID, ...rest }: CanvasProps) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents={pointerEvents}
      style={style}
    >
      <Canvas testID={testID} {...rest} style={FILL}>{children}</Canvas>
    </View>
  );
}
