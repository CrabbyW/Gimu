import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { DotSteps } from '@/components/ui/DotSteps';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

interface Props { total: number; /** 0-based index aktuálního cviku. */ current: number; onClose(): void }

const ICON = 24;

/** Horní řada lekce: zavírací „✕“ vlevo, tečky průběhu cviků vpravo. */
export function LessonProgress({ total, current, onClose }: Props) {
  const { c, space, size } = useTheme();
  const HIT = size.hit;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: HIT, marginTop: space.s }}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={copy.lesson.close}
        style={{ width: HIT, height: HIT, justifyContent: 'center', marginLeft: -(HIT - ICON) / 2, alignItems: 'center' }}
      >
        <X size={ICON} color={c.text} strokeWidth={1.5} />
      </Pressable>
      <View accessibilityLabel={copy.lesson.progressA11y(current + 1, total)}>
        <DotSteps total={total} current={current} />
      </View>
    </View>
  );
}
