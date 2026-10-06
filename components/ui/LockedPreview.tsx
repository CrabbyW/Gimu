import { Lock } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { DotRule } from './DotRule';
import { PillButton } from './PillButton';
import { Text } from './Text';
import { Tile } from './Tile';

interface Props {
  title: string;
  body: string;
  /** Volitelná primární akce (jedna na obrazovce). */
  cta?: { label: string; onPress(): void };
  style?: StyleProp<ViewStyle>;
}

/** Délky ghost jmen v tečkách: tři různé, ať se řádky nečtou jako vzor. */
const GHOST_NAME = [18, 13, 9] as const;
const GHOST_XP = 4;

/** Zamčený náhled (Nothing Dot fáze 2): dlaždice se zámkem a `headline`, vysvětlení `body muted`, tři ghost
 *  řádky ze zhasnutých teček (stavba řádku ligy: pořadí, kruh místo opičky, jméno, XP; žádná vymyšlená čísla)
 *  a volitelná pilulka. Bez maskota: zamčený stav má být srozumitelný, ne smutný. Bez plátna. */
export function LockedPreview({ title, body, cta, style }: Props) {
  const { c, space, radius, size, stroke } = useTheme();
  return (
    <Tile style={[{ gap: space.m }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
        <Lock size={size.lockIcon} color={c.muted} strokeWidth={stroke.icon} />
        <Text variant="headline" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Text>
      </View>
      <Text tone="muted">{body}</Text>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {GHOST_NAME.map((n, i) => (
          <View key={n} style={{ minHeight: size.hit, flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Text variant="stat" tone="faint" style={{ width: size.rankCol, textAlign: 'right' }}>{i + 1}</Text>
            <View style={{ width: size.rowMascot, height: size.rowMascot, borderRadius: radius.full, borderWidth: stroke.icon, borderColor: c.dotDim }} />
            <View style={{ flex: 1 }}><DotRule count={n} /></View>
            <DotRule count={GHOST_XP} />
          </View>
        ))}
      </View>
      {cta ? <PillButton label={cta.label} onPress={cta.onPress} style={{ marginTop: space.s }} /> : null}
    </Tile>
  );
}
