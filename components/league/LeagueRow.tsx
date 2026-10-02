import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { dur, intro, motion, stagger, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

const RISE = 8;

interface Props {
  entry: LeagueEntry; rank: number; /** Pořadí v nástupu (stagger). */ index: number;
  /** Úvodní sled tabu (jen první zobrazení); jinak řádek stojí hned. */
  play?: boolean;
}

/**
 * Řádek tabulky 56 pt: pořadí (Bebas, tabulární, 32), mini opice 32, jméno Inter 600, XP vpravo.
 * Vlastní řádek: pozadí `raised` + proužek 3 pt v `text` vlevo a pořadí v `text` (ostatní `muted`).
 * R42: bez akcentu, vlastní řádek nese kontrast a tvar. Žádné linky mezi řádky.
 */
export function LeagueRow({ entry, rank, index, play = true }: Props) {
  const { c, space, size } = useTheme();
  const me = entry.isMe;
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
        height: size.leagueRow, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.l,
        backgroundColor: me ? c.raised : 'transparent',
      }]}
    >
      {me ? <Animated.View style={[stripe, { position: 'absolute', left: 0, top: 0, bottom: 0, width: size.ownStripe, backgroundColor: c.text }]} /> : null}
      <Text variant="counter" tone={me ? 'text' : 'muted'} maxFontSizeMultiplier={1} numberOfLines={1} style={{ width: size.rankCol, textAlign: 'right' }}>
        {rank}
      </Text>
      {/* Maskot bez interakce; dech běží dál (reanimated na UI vlákně). */}
      {/* Pro čtečku skrytá: řádek je jeden prvek s `rowA11y`, cizí opice nesmí číst „Tvoje opice“. */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood="idle" size={size.rowMascot} decorative />
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{entry.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
        <Text variant="counter" maxFontSizeMultiplier={1}>{entry.xpThisWeek}</Text>
        <Text variant="label" tone="muted">{copy.league.xp}</Text>
      </View>
    </Animated.View>
  );
}
