import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Mascot, type MascotReaction } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { dur, intro, motion, stagger, useMotionSafe } from '@/lib/motion';
import { layout, useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

const RISE = 8;

interface Props {
  entry: LeagueEntry; rank: number; /** Pořadí v nástupu (stagger). */ index: number;
  /** Úvodní sled tabu (jen první zobrazení); jinak řádek stojí hned. */
  play?: boolean;
  /** Poslední řádek před zónou / koncem: bez spodní vlasové linky (oddělení nese zóna nebo patička). */
  last?: boolean;
  /** Reakce opičky (fáze 3): jen vlastní řádek, výsledek minulého týdne. */
  reaction?: MascotReaction | null;
}

/**
 * Řádek tabulky (Nothing Dot fáze 2): kompaktní řádek min. 56 pt přímo na `base`, oddělený vlasovou linkou `rule`.
 * Pořadí `stat` muted ve sloupci `rankCol`, mini SVG opička 32 (ne Skia: řádků je ~30 a plátna mají rozpočet),
 * jméno `body`, XP `stat` tabulárně v pevném sloupci. Bez vlastních pláten.
 * Vlastní řádek = jediná dlaždice seznamu (`tile`) s hranou `text` 2 pt: zvýraznění tvarem, ne barvou.
 */
export function LeagueRow({ entry, rank, index, play = true, last = false, reaction = null }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const me = entry.isMe;
  const { fontScale } = useWindowDimensions();
  const xpCol = size.leagueXpCol * Math.min(Math.max(fontScale, 1), layout.statMaxScale);
  // Nástup řádku: fade + zdvih 8 pt, sled `stagger(i)` (≤ 360 ms), `motion.enter`. Vlastní shared value
  // místo layout animace `entering`: ta se ve virtualizovaných buňkách FlatListu na webu rozjede (překryv řádků).
  // Vlastní řádek přijde poslední, až dojede scroll na něj (víčko sledu + 140 ms), zvedne se z 16 pt.
  const { reduced } = useMotionSafe();
  const L = intro.league;
  const animate = play && !reduced;
  const t = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    const at = me ? L.rows + dur.staggerCap + L.meLag : L.rows + stagger(index);
    t.set(withDelay(at, withTiming(1, motion.enter)));
    // Sled se rozhoduje při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rise = me ? L.meRise : RISE;
  const enter = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * rise }] }));
  return (
    <Animated.View
      accessible
      accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
      style={[enter, me ? { marginHorizontal: space.s, marginVertical: space.xs } : null]}
    >
      <View
        style={[
          {
            minHeight: size.leagueRow, flexDirection: 'row', alignItems: 'center', gap: space.m,
            paddingVertical: space.s,
          },
          me
            // Dlaždice o `space.s` užší z každé strany: obsah lícuje s ostatními řádky (s + m = l).
            ? { paddingHorizontal: space.m, backgroundColor: c.tile, borderRadius: radius.tile, borderWidth: stroke.focus, borderColor: c.text }
            : { marginHorizontal: space.l, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule },
        ]}
      >
        <Text variant="stat" tone={me ? 'text' : 'muted'} numberOfLines={1} style={{ width: size.rankCol, textAlign: 'right' }}>
          {rank}
        </Text>
        {/* Pro čtečku skrytá: řádek je jeden prvek s `rowA11y`, cizí opice nesmí číst „Tvoje opice“. */}
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
          <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood="idle" size={size.rowMascot} decorative reaction={reaction} />
        </View>
        <Text variant={me ? 'bodyStrong' : 'body'} numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1 }}>{entry.name}</Text>
        <Text variant="stat" tone={me ? 'text' : 'muted'} numberOfLines={1} style={{ width: xpCol, textAlign: 'right' }}>
          {copy.league.xpValue(entry.xpThisWeek)}
        </Text>
      </View>
    </Animated.View>
  );
}
