import { useEffect, useRef } from 'react';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotRow } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { copy } from '@/data/copy';
import { plateFlight } from '@/lib/motion';
import { getFlight, land, measureRect } from '@/lib/plateFlight';
import { useTheme } from '@/theme';

interface Props { total: number; /** 0-based index aktuálního cviku. */ current: number; onClose(): void }

/** Horní řada lekce (Nothing Dot, obr. 5): zavírací kulaté tlačítko vlevo (tile + vlasová hrana, jako v ScreenHeader), uprostřed řádek teček (jedna tečka = jeden cvik,
 *  rozsvícené odcvičené), vpravo mono pozice „02/05“. Bez akcentu, pokrok nese světlo teček. */
export function LessonProgress({ total, current, onClose }: Props) {
  const { c, space, size, stroke, radius } = useTheme();
  const feedback = usePressFeedback(0.9);
  // Horní safe area z hooku, ne ze SafeAreaView: lekce je iOS fullScreenModal a tam SafeAreaView horní výřez
  // (hodiny, Dynamic Island) nepromítla, takže křížek ležel pod hodinami a nešel stisknout.
  const insets = useSafeAreaInsets();
  // Let kotouče (spec §2.3): řada teček je cíl. Měří se až po dojetí modalu (`plateFlight.settleMs`), během
  // nativního přechodu by measureInWindow vrátil polohu v pohybu. Bez letu nebo se selháním měření nic.
  const row = useRef<View>(null);
  useEffect(() => {
    if (!getFlight()) return;
    let live = true;
    const t = setTimeout(() => {
      measureRect(row.current, plateFlight.measureMaxMs).then((r) => { if (live) land(r); }, () => undefined);
    }, plateFlight.settleMs);
    return () => { live = false; clearTimeout(t); };
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: size.iconButton, marginTop: insets.top + space.s }}>
      <Animated.View style={feedback.style}>
        <Pressable
          onPress={onClose}
          onPressIn={feedback.onPressIn}
          onPressOut={feedback.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={copy.lesson.close}
          style={({ pressed }) => ({
            width: size.iconButton, height: size.iconButton, borderRadius: radius.full,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? c.tilePressed : c.tile,
            borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
          })}
        >
          <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </Animated.View>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <View ref={row} collapsable={false}>
          <DotRow
            total={total}
            fraction={total > 0 ? current / total : 0}
            accessibilityLabel={copy.lesson.progressA11y(current + 1, total)}
          />
        </View>
      </View>
      <Text variant="telemetry" importantForAccessibility="no" accessibilityElementsHidden>
        {copy.lesson.progressValue(current + 1, total)}
      </Text>
    </View>
  );
}
