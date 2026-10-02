import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface Props {
  /** Název sezóny; v kruhu jsou jeho iniciály („Winter Arc“ → „WA“). */
  seasonName: string;
  large?: boolean;
  /** Na akcentové ploše (odměna v recapu) lem i písmo v `onAccent`; zlatý lem by na emberu zanikl. */
  onAccent?: boolean;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0] ?? '').join('').slice(0, 3).toUpperCase();

/** Odznak sezóny: kruh se zlatým lemem `seasonGold` (materiál sezónní odměny, §7.8), iniciály display řezem. */
export function SeasonBadge({ seasonName, large = false, onAccent = false }: Props) {
  const { c, size, radius, stroke, space } = useTheme();
  const d = large ? size.seasonBadgeLarge : size.seasonBadge;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: d, height: d, borderRadius: radius.full, borderWidth: stroke.focus, borderColor: onAccent ? c.onAccent : c.seasonGold,
        alignItems: 'center', justifyContent: 'center', padding: space.xs,
      }}
    >
      <Text
        variant={large ? 'title' : 'choiceTitle'}
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={onAccent ? { color: c.onAccent } : undefined}
      >
        {initials(seasonName)}
      </Text>
    </View>
  );
}
