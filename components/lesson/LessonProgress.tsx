import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { DotRow } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

interface Props { total: number; /** 0-based index aktuálního cviku. */ current: number; onClose(): void }

/** Horní řada lekce (Nothing Dot, obr. 5): zavírací „✕“ vlevo, uprostřed řádek teček (jedna tečka = jeden cvik,
 *  rozsvícené odcvičené), vpravo mono pozice „02/05“. Bez akcentu, pokrok nese světlo teček. */
export function LessonProgress({ total, current, onClose }: Props) {
  const { c, space, size, stroke } = useTheme();
  const HIT = size.hit;
  const ICON = size.icon;
  const feedback = usePressFeedback(0.9);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: HIT, marginTop: space.s }}>
      <Animated.View style={feedback.style}>
        <Pressable
          onPress={onClose}
          onPressIn={feedback.onPressIn}
          onPressOut={feedback.onPressOut}
          accessibilityRole="button"
          accessibilityLabel={copy.lesson.close}
          style={{ width: HIT, height: HIT, justifyContent: 'center', marginLeft: -(HIT - ICON) / 2, alignItems: 'center' }}
        >
          <X size={ICON} color={c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </Animated.View>
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <DotRow
          total={total}
          fraction={total > 0 ? current / total : 0}
          accessibilityLabel={copy.lesson.progressA11y(current + 1, total)}
        />
      </View>
      <Text variant="telemetry" importantForAccessibility="no" accessibilityElementsHidden>
        {copy.lesson.progressValue(current + 1, total)}
      </Text>
    </View>
  );
}
