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

/** Dlaždice odznaku 64 (Teplá litina §3.5). Získaný = plná litina (`plate15`) se symbolem v `text`
 *  a názvem pod ním. Zamčený = obrys siluety ve `faint` na `surface` se zámkem `muted` a podmínkou
 *  `caption muted`. Obrys místo plné `faint` výplně: zámek `muted` na plné `faint` ploše by neměl kontrast. */
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
          backgroundColor: earned ? c.plate15 : 'transparent',
          borderWidth: earned ? 0 : stroke.icon, borderColor: c.faint,
        }}
      >
        {earned
          ? <Medal size={size.icon} color={c.text} strokeWidth={stroke.icon} />
          : <Lock size={size.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />}
      </View>
      <Text variant="caption" tone={earned ? 'text' : 'muted'} numberOfLines={2} style={{ textAlign: 'center' }}>
        {earned ? name : condition}
      </Text>
    </Pressable>
  );
}
