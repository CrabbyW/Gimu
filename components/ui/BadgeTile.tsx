import { Lock, Medal } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  name: string;
  /** Podmínka z katalogu (`badgeCondition`), např. „7 dní v řadě“. */
  condition: string;
  earned: boolean;
  /** Tap otevře detail (popover řeší volající). */
  onPress?(): void;
}

/**
 * Odznak 64 (Nothing Dot fáze 2): kruh z RN View, ne Skia (odznaků je víc, než dovolí rozpočet pláten).
 * Získaný = plná `text` plocha s medailí v `onText` a názvem pod ní (nejsilnější tvar v sekci).
 * Zamčený = obrys `dotDim` se zámkem `muted` a podmínkou: ukazuje, co dál, ne co chybí.
 */
export function BadgeTile({ name, condition, earned, onPress }: Props) {
  const { c, space, radius, size, stroke } = useTheme();
  const d = size.badgeTile;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPress ? () => feedback('tapLight') : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={earned ? copy.badgeTile.earnedA11y(name) : copy.badgeTile.lockedA11y(name, condition)}
      style={{ width: d, alignItems: 'center', gap: space.xs }}
    >
      <View
        style={{
          width: d, height: d, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
          backgroundColor: earned ? c.text : 'transparent',
          borderWidth: earned ? 0 : stroke.icon, borderColor: c.dotDim,
        }}
      >
        {earned
          ? <Medal size={size.icon} color={c.onText} strokeWidth={stroke.icon} />
          : <Lock size={size.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />}
      </View>
      <Text variant="caption" tone={earned ? 'text' : 'muted'} numberOfLines={2} style={{ textAlign: 'center' }}>
        {earned ? name : condition}
      </Text>
    </Pressable>
  );
}
