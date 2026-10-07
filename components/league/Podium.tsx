import { View } from 'react-native';
import { DotRow } from '@/components/dots';
import { IdleMascot, Mascot, type MascotReaction } from '@/components/mascot';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { intro, motion } from '@/lib/motion';
import { dots, useTheme, tabularNums } from '@/theme';
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
export function Podium({ entries, play = false, meReaction = null }: {
  entries: LeagueEntry[]; play?: boolean;
  /** Reakce vlastní opičky na pódiu (fáze 3, výsledek minulého týdne). */
  meReaction?: MascotReaction | null;
}) {
  const { space, size } = useTheme();
  if (entries.length === 0 || entries.every((e) => e.xpThisWeek === 0)) return null;
  const columns = podiumColumns(Math.min(entries.length, 3));
  return (
    <View testID="league-podium" style={{ paddingHorizontal: space.l, paddingBottom: space.m }}>
      <Tile style={{ gap: space.m }}>
        <Text variant="label" tone="muted">{copy.league.podiumKicker}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.s }}>
          {columns.map(({ rank, dots: height }) => {
            const entry = entries[rank - 1]!;
            // Motion: sloupce rostou zdola tečku po tečce (DotRow `from="bottom"`) v pořadí 1 → 2 → 3,
            // opička dosedne po dorůstání svého sloupce, pak popisky.
            const at = P.at + P.step * (rank - 1);
            return (
              <View
                key={entry.userId}
                testID="podium-column"
                accessible
                accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
                style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: space.s }}
              >
                <Reveal play={play} delay={at + P.mascotLag} rise={P.mascotRise} config={motion.reveal}>
                  <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {/* Vítěz žije: poskakuje radostí častěji (idle kontext `podium`), ostatní stojí. */}
                    {rank === 1 ? (
                      <IdleMascot idleContext="podium" stage={entry.stage} cosmetics={entry.cosmetics} mood="happy" size={size.podiumMascot} decorative hop={false} reaction={entry.isMe ? meReaction : null} />
                    ) : (
                      <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood="idle" size={size.podiumMascot} decorative hop={false} reaction={entry.isMe ? meReaction : null} />
                    )}
                  </View>
                </Reveal>
                <DotRow total={height * dots.podium.cols} fraction={1} columns={dots.podium.cols} dot={dots.podium.d} from="bottom" intro={play ? at : false} />
                <Reveal play={play} delay={at + P.mascotLag + P.labelLag} rise={P.rise} config={motion.reveal} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
                  <Text variant="dotStat" tone={rank === 1 ? 'text' : 'muted'}>{rank}</Text>
                  <Text variant={entry.isMe ? 'bodyStrong' : 'caption'} numberOfLines={1} style={{ textAlign: 'center' }}>{entry.name}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1} style={tabularNums}>{copy.league.podiumXp(entry.xpThisWeek)}</Text>
                </Reveal>
              </View>
            );
          })}
        </View>
      </Tile>
    </View>
  );
}
