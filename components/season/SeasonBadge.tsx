import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

interface Props {
  /** Název sezóny; v kruhu jsou jeho iniciály („Winter Arc“ → „WA“). */
  seasonName: string;
  large?: boolean;
  /** Na zlaté ploše (stage-up, odměna v recapu) lem i písmo v `onAccent`; zlatý lem by na zlaté zanikl. */
  onAccent?: boolean;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0] ?? '').join('').slice(0, 3).toUpperCase();

/**
 * Odznak sezóny (Nothing Dot fáze 2): jediné místo UI se `seasonGold` (spec §2.1). Kruh s lemem `seasonGold`,
 * iniciály mono. Zlato je materiál sezónní odměny, ne akcent: nikde jinde v UI se neobjeví.
 */
export function SeasonBadge({ seasonName, large = false, onAccent = false }: Props) {
  const { c, size, radius, stroke, space } = useTheme();
  const d = large ? size.seasonBadgeLarge : size.seasonBadge;
  const ink = onAccent ? c.onAccent : c.seasonGold;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: d, height: d, borderRadius: radius.full, borderWidth: stroke.focus, borderColor: ink,
        alignItems: 'center', justifyContent: 'center', padding: space.xs,
      }}
    >
      <Text
        variant={large ? 'headline' : 'label'}
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        // Iniciály v `text` (zlato má na světlém podkladu jen ~2:1, jako písmo by neprošlo AA); zlatý je lem.
        style={{ color: onAccent ? c.onAccent : c.text, letterSpacing: 0 }}
      >
        {initials(seasonName)}
      </Text>
    </View>
  );
}
