import { View } from 'react-native';
import { Mascot } from '@/components/mascot';
import { Reveal } from '@/components/ui/choreo';
import { PlateStack } from '@/components/ui/PlateStack';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro, motion } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

/**
 * Pódium top 3 (hloubka a materiál, 2026-10-03): hero ligy nad tabulkou. Pořadí sloupců 2 · 1 · 3,
 * stupně jsou stohy litinových kotoučů (`PlateStack`) různé výšky, na každém stojí mini opička soupeře.
 * Pod stupněm pořadí `stat`, jméno `caption` a XP `caption muted`. Bez akcentu: vlastní místo pozná
 * uživatel podle tučného jména (stejně jako v řádku); jantar zůstává proužku vlastního řádku.
 * Každý sloupec je jeden prvek pro čtečku (`rowA11y`), opičky jsou dekorativní.
 */
const P = intro.podium;

export function Podium({ entries, play = false }: { entries: LeagueEntry[]; play?: boolean }) {
  const { space, size } = useTheme();
  if (entries.length < 3) return null;
  // Na začátku týdne (nikdo nemá XP) by pódium řadilo náhodně. Skryje se; prázdný stav nese věta v hlavičce ligy.
  if (entries.every((e) => e.xpThisWeek === 0)) return null;
  const steps = [
    { rank: 2, entry: entries[1]!, width: size.podiumSecond, count: size.podiumSecondCount },
    { rank: 1, entry: entries[0]!, width: size.podiumFirst, count: size.podiumFirstCount },
    { rank: 3, entry: entries[2]!, width: size.podiumThird, count: size.podiumThirdCount },
  ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.m, paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.l }}>
      {steps.map(({ rank, entry, width, count }) => {
        // Motion (polish 2026-10-05): stupně rostou v pořadí 1 → 2 → 3, opička dosedne na svůj stupeň, pak popisky.
        // Jen timing (pódium není klikatelné, ale je to obsah, ne odměna). Prvky se mountují až s pódiem,
        // takže sled hraje i při přechodu z prázdného stavu hlavičky.
        const at = P.at + P.step * (rank - 1);
        return (
        <View
          key={entry.userId}
          accessible
          accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
          style={{ flex: 1, alignItems: 'center', gap: space.s }}
        >
          <View style={{ alignItems: 'center' }}>
            <Reveal play={play} delay={at + P.mascotLag} rise={P.mascotRise} config={motion.reveal}>
            <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood={rank === 1 ? 'happy' : 'idle'} size={size.podiumMascot} decorative hop={false} />
            </View>
            </Reveal>
            <PlateStack count={count} width={width} play={play} delay={at} />
          </View>
          <Reveal play={play} delay={at + P.mascotLag + P.labelLag} rise={P.rise} config={motion.reveal} style={{ alignItems: 'center' }}>
            <Text variant="stat" tone={rank === 1 ? 'text' : 'muted'}>{rank}</Text>
            <Text variant={entry.isMe ? 'bodyStrong' : 'caption'} numberOfLines={1} style={{ maxWidth: width + space.m, textAlign: 'center' }}>{entry.name}</Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>{copy.league.podiumXp(entry.xpThisWeek)}</Text>
          </Reveal>
        </View>
        );
      })}
    </View>
  );
}
