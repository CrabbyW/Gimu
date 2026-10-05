import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Keyboard, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { RevealOnFocusContext, type RevealOnFocus } from './revealOnFocus';

interface Props {
  /** Výchozí horní i spodní hrana. Obrazovka s BigActionBar předá ['top'] — lišta si spodní safe area odsadí sama. */
  edges?: readonly Edge[];
  scroll?: boolean;
  children?: ReactNode;
}

export function Screen({ edges = ['top', 'bottom'], scroll = false, children }: Props) {
  const { c, space } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.base }}>
      {scroll ? (
        <RevealingScroll>{children}</RevealingScroll>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.l }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** ScrollView, který drží pole s fokusem nad klávesnicí. Spouští se fokusem, zobrazením klávesnice
 *  a změnou výšky výřezu (KeyboardAvoidingView na iOS, resize okna na Androidu). Porovnává polohy
 *  v okně, takže nezáleží na tom, jak hluboko je pole zanořené. */
function RevealingScroll({ children }: { children?: ReactNode }) {
  const { space } = useTheme();
  const viewport = useRef<View>(null);
  const scroller = useRef<ScrollView>(null);
  const target = useRef<View | null>(null);
  const offsetY = useRef(0);

  const reveal = useCallback(() => {
    const field = target.current;
    if (!field || !viewport.current || !scroller.current) return;
    viewport.current.measureInWindow((_vx, vy, _vw, vh) => {
      field.measureInWindow((_x, y, _w, h) => {
        const overBottom = y + h - (vy + vh - space.l);
        const overTop = vy + space.l - y;
        // Vysoké pole se zarovná nahoru, jinak jen tolik, aby celé bylo vidět.
        const delta = overTop > 0 || h > vh - space.l * 2 ? -overTop : Math.max(0, overBottom);
        if (Math.abs(delta) < 1) return;
        scroller.current?.scrollTo({ y: Math.max(0, offsetY.current + delta), animated: true });
      });
    });
  }, [space.l]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', reveal);
    return () => sub.remove();
  }, [reveal]);

  const context = useMemo<RevealOnFocus>(() => ({
    focus: (node) => { target.current = node; requestAnimationFrame(reveal); },
    blur: (node) => { if (target.current === node) target.current = null; },
  }), [reveal]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { offsetY.current = e.nativeEvent.contentOffset.y; };

  return (
    <RevealOnFocusContext.Provider value={context}>
      <View ref={viewport} onLayout={reveal} style={{ flex: 1 }}>
        <ScrollView
          ref={scroller}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.l, paddingBottom: space.xl }}
        >
          {children}
        </ScrollView>
      </View>
    </RevealOnFocusContext.Provider>
  );
}
