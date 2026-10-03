import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Mascot } from '@/components/mascot';
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
}

/**
 * Řádek tabulky min. 56 pt (Teplá litina §3.2): pořadí `stat` (sloupec `rankCol`), mini opice 32, jméno `body`
 * s ellipsis, XP `stat` tabulárně v pevném sloupci `leagueXpCol` × fontScale (strop 1.4).
 * Vlastní řádek: `raised` + proužek 3 pt `accentGraphic` vlevo, bez stínu a bez zvětšení. Žádné linky mezi řádky.
 */
export function LeagueRow({ entry, rank, index, play = true }: Props) {
  const { c, space, size } = useTheme();
  const me = entry.isMe;
  const { fontScale } = useWindowDimensions();
  const xpCol = size.leagueXpCol * Math.min(Math.max(fontScale, 1), layout.statMaxScale);
  // Nástup řádku: fade + zdvih 8 pt, sled `stagger(i)` (≤ 360 ms), `motion.enter`. Vlastní shared value
  // místo layout animace `entering`: ta se ve virtualizovaných buňkách FlatListu na webu rozjede (překryv řádků).
  // Vyvrcholení (motion): vlastní řádek přijde poslední, až dojede scroll na něj (víčko sledu + 140 ms),
  // zvedne se z 16 pt a pak mu vyroste proužek (scaleY 0 → 1, 260 ms punch). Omezený pohyb: vše stojí.
  const { reduced } = useMotionSafe();
  const L = intro.league;
  const animate = play && !reduced;
  const t = useSharedValue(animate ? 0 : 1);
  const s = useSharedValue(animate && me ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    const at = me ? L.rows + dur.staggerCap + L.meLag : L.rows + stagger(index);
    t.set(withDelay(at, withTiming(1, motion.enter)));
    if (me) s.set(withDelay(at + dur.enter * 0.6, withTiming(1, { duration: L.stripeMs, easing: motion.enter.easing })));
    // Sled se rozhoduje při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rise = me ? L.meRise : RISE;
  const enter = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * rise }] }));
  const stripe = useAnimatedStyle(() => ({ transform: [{ scaleY: s.value }] }));
  return (
    <Animated.View
      accessible
      accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
      style={[enter, {
        minHeight: size.leagueRow, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.l, paddingVertical: space.s,
        backgroundColor: me ? c.raised : 'transparent',
      }]}
    >
      {me ? <Animated.View style={[stripe, { position: 'absolute', left: 0, top: 0, bottom: 0, width: size.ownStripe, backgroundColor: c.accentGraphic }]} /> : null}
      <Text variant="stat" tone={me ? 'text' : 'muted'} numberOfLines={1} style={{ width: size.rankCol, textAlign: 'right' }}>
        {rank}
      </Text>
      {/* Maskot bez interakce; dech běží dál (reanimated na UI vlákně). */}
      {/* Pro čtečku skrytá: řádek je jeden prvek s `rowA11y`, cizí opice nesmí číst „Tvoje opice“. */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood="idle" size={size.rowMascot} decorative />
      </View>
      <Text variant={me ? 'bodyStrong' : 'body'} numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1 }}>{entry.name}</Text>
      {/* Pevný sloupec pro „9 999“: čísla pod sebou lícují vpravo bez ohledu na délku. Šířka roste s písmem do stropu `stat`. */}
      <Text variant="stat" numberOfLines={1} style={{ width: xpCol, textAlign: 'right' }}>{copy.league.xpValue(entry.xpThisWeek)}</Text>
    </Animated.View>
  );
}
