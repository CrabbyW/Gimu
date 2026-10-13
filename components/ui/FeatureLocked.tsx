import { Lock } from 'lucide-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { DotRow, IntentScrollView } from '@/components/dots';
import { Mascot } from '@/components/mascot';
import { poseForAppState } from '@/logic/mascotPoses';
import { copy } from '@/data/copy';
import { enterSafe, motion, useMotionSafe } from '@/lib/motion';
import type { CosmeticSlot, MascotStage } from '@/types';
import { dots, useTheme } from '@/theme';
import { PillButton } from './PillButton';
import { Text } from './Text';
import { Tile } from './Tile';

interface Props {
  /** Co se odemkne: jedna věta „co to je“ (copy.disclosure.what.*). */
  what: string;
  /** Kolik lekcí zbývá a kolik je hotovo z kolika (dotRow pokroku k odemčení). */
  left: number;
  done: number;
  need: number;
  stage: MascotStage;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  /** Jedna akce: na mapu k další lekci. */
  onCta(): void;
}

/**
 * Zamčená funkce (UX pass U4, progresivní odhalení): klidná pozvánka, ne zeď. Opička (jediná barva obrazovky)
 * vpravo nahoře vedle mono štítku LOCKED se zámkem, `headline` „Unlocks after N more lessons“, jedna věta co to je,
 * tečkový řádek pokroku k odemčení (hotové lekce rozsvícené) a jedna pilulka na mapu.
 * Hierarchie: nejsilnější je věta s počtem lekcí (konkrétní cíl), pak tečky; opička jen doprovází.
 */
export function FeatureLocked({ what, left, done, need, stage, cosmetics, onCta }: Props) {
  const { c, space, size, stroke } = useTheme();
  const { reduced } = useMotionSafe();
  return (
    <IntentScrollView testID="feature-locked" contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }}>
      <Tile style={{ gap: space.m }}>
        {/* UX pass U5: opička nahoře jako hrdina dlaždice (`heroMascot` 96, jediná barva), pod ní štítek se zámkem.
            Vše zarovnané vlevo do jedné osy; pilulka se stále vejde nad ohyb i na 320 × 568. */}
        {/* Nástup opičky (U5): krátký zdvih s prolnutím; omezený pohyb = `calmFade`. */}
        <Animated.View entering={enterSafe(reduced, 0, motion.mascotReveal.rise)}>
          <Mascot stage={stage} mood="idle" pose={poseForAppState('locked')} size={size.heroMascot} cosmetics={cosmetics} decorative hop={false} />
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Lock size={size.lockIcon} color={c.muted} strokeWidth={stroke.icon} />
          <Text variant="label" tone="muted">{copy.disclosure.kicker}</Text>
        </View>
        <View style={{ gap: space.xs }}>
          <Text variant="headline" accessibilityRole="header">{copy.disclosure.unlocksIn(left)}</Text>
          <Text tone="muted">{what}</Text>
        </View>
        <View
          accessible
          accessibilityLabel={copy.disclosure.tallyA11y(done, need)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}
        >
          <View style={{ flex: 1 }}>
            <DotRow total={need} fraction={need > 0 ? done / need : 0} columns={need} dot={dots.row.d} intro={false} />
          </View>
          <Text variant="label" tone="muted">{copy.disclosure.tally(done, need)}</Text>
        </View>
        <PillButton label={copy.disclosure.cta} onPress={onCta} style={{ marginTop: space.s }} />
      </Tile>
    </IntentScrollView>
  );
}
