import { useMemo, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { dots, useTheme } from '@/theme';
import { DotField } from './DotField';
import { backgroundPitch } from './geometry';
import { ScrollIntentProvider, useScrollIntent } from './scrollIntent';
import { useDotTouch } from './useDotTouch';

export type ReactiveTone = 'base' | 'gold';

interface Props {
  /** `base` = `dotOff` na `base`; `gold` = zlatá plocha stage-up (`goldDotOff`, pod prstem `goldDotDim`). */
  tone?: ReactiveTone;
  /** Vypnout dotykovou vlnu (pole zůstane statické). */
  interactive?: boolean;
  /** Skrýt pole (např. recap na oslavné inverzní ploše); strom a gesto zůstávají, nic se nepřemontuje. */
  visible?: boolean;
  accessibilityViewIsModal?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Reaktivní pozadí obrazovky (spec §4.1): celoplošné tlumené pole teček za obsahem, které pod prstem
 * odsune tečky a rozjasní je. Kořen obrazovky: `GestureDetector` s gestem `useDotTouch` (Manual, nikdy
 * se neaktivuje → scroll, tapy i další gesta běží souběžně). Pole je absolutně v kořeni a nescrolluje,
 * takže souřadnice doteku = souřadnice kořene. Jedno Skia plátno; vše na UI vlákně.
 * Záměr scrollu (`useScrollIntent`): `IntentScrollView` uvnitř se rozjede jen při jasně svislém tahu,
 * vodorovné a šikmé tahy patří tečkám. Omezený pohyb: pole statické (řeší `useDotTouch`), gesta stejná.
 */
export function ReactiveBackground({ tone = 'base', interactive = true, visible = true, accessibilityViewIsModal, style, children }: Props) {
  const { c } = useTheme();
  const field = useDotTouch(interactive && visible);
  const play = useScrollIntent(interactive && visible);
  const gesture = useMemo(() => Gesture.Simultaneous(field.gesture, play), [field.gesture, play]);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!box || box.w !== width || box.h !== height) setBox({ w: width, h: height });
  };
  const ink = tone === 'gold' ? { off: c.goldDotOff, on: c.goldDotDim } : undefined;
  return (
    <GestureDetector gesture={gesture}>
      <View onLayout={onLayout} accessibilityViewIsModal={accessibilityViewIsModal} style={[{ flex: 1 }, style]}>
        {box && visible ? (
          <DotField
            width={box.w}
            height={box.h}
            pitch={backgroundPitch(box.w, box.h, dots.field.pitch, dots.field.max)}
            touch={field.touch}
            ink={ink}
            restOpacity={dots.background.restOpacity}
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
        ) : null}
        <ScrollIntentProvider gesture={interactive && visible ? play : null}>{children}</ScrollIntentProvider>
      </View>
    </GestureDetector>
  );
}
