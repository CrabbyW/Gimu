import { View } from 'react-native';
import { DotRow } from '@/components/dots';
import { Mascot } from '@/components/mascot';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { intro, motion } from '@/lib/motion';
import { dots, useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';
import { podiumColumns } from './podiumLayout';

const P = intro.podium;

/**
 * Pódium top 3 (Nothing Dot fáze 2): dlaždice se sloupci z teček v pořadí 2 · 1 · 3 (`podiumColumns`).
 * Sloupec = `DotRow` 3 tečky široký, výška v řádcích = pořadí (9 / 6 / 4), všechny tečky rozsvícené.
 * Nad sloupcem mini SVG opička soupeře, pod ním Doto `dotStat` pořadí, jméno a XP.
 * Méně než 3 hráči = jen existující sloupce; nikdo s XP = pódium se nekreslí (pořadí by bylo náhodné,
 * prázdný stav nese věta v hero dlaždici). Nejvýš 3 plátna.
 */
export function Podium({ entries, play = false }: { entries: LeagueEntry[]; play?: boolean }) {
  const { space, size } = useTheme();
  if (entries.length === 0 || entries.every((e) => e.xpThisWeek === 0)) return null;
  const columns = podiumColumns(Math.min(entries.length, 3));
  return (
    <View style={{ paddingHorizontal: space.l, paddingBottom: space.m }}>
      <Tile style={{ gap: space.m }}>
        <Text variant="label" tone="muted">{copy.league.podiumKicker}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.s }}>
          {columns.map(({ rank, dots: height }) => {
            const entry = entries[rank - 1]!;
            // Motion: sloupce rostou v pořadí 1 → 2 → 3, opička dosedne, pak popisky.
            const at = P.at + P.step * (rank - 1);
            return (
              <View
                key={entry.userId}
                accessible
                accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
                style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: space.s }}
              >
                <Reveal play={play} delay={at + P.mascotLag} rise={P.mascotRise} config={motion.reveal}>
                  <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood={rank === 1 ? 'happy' : 'idle'} size={size.podiumMascot} decorative hop={false} />
                  </View>
                </Reveal>
                <DotRow total={height * dots.podium.cols} fraction={1} columns={dots.podium.cols} dot={dots.podium.d} intro={play ? at : false} />
                <Reveal play={play} delay={at + P.mascotLag + P.labelLag} rise={P.rise} config={motion.reveal} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
                  <Text variant="dotStat" tone={rank === 1 ? 'text' : 'muted'}>{rank}</Text>
                  <Text variant={entry.isMe ? 'bodyStrong' : 'caption'} numberOfLines={1} style={{ textAlign: 'center' }}>{entry.name}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>{copy.league.podiumXp(entry.xpThisWeek)}</Text>
                </Reveal>
              </View>
            );
          })}
        </View>
      </Tile>
    </View>
  );
}
