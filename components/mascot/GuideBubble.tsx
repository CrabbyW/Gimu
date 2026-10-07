import { Pressable, StyleSheet, View } from 'react-native';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import type { GuideId } from '@/logic/guide';
import { motion } from '@/lib/motion';
import { dots, useTheme } from '@/theme';

interface Props {
  id: GuideId;
  /** Tap na bublinu = schovat a zapsat jako viděnou (`useGuide().dismiss`). */
  onDismiss(): void;
  /** Kam míří tečková šipka: nahoru (cíl nad bublinou) nebo dolů (cíl pod ní). */
  arrow: 'up' | 'down';
  /** Vodorovná poloha šipky pod/nad bublinou. */
  align?: 'start' | 'center' | 'end';
  /** Zpoždění nástupu (ms), např. až po CTA oslavy. */
  delay?: number;
  /** false = místo je rezervované, bublina ještě neviditelná a nedotyková (oslava: až s CTA). */
  play?: boolean;
}

/**
 * Opička průvodce (elite fáze 1, spec §2.4): malá dlaždice s mono štítkem MONKEY a jednou větou v mono,
 * tečková šipka (sloupec teček + hrot) míří k cíli. Max. 1 na obrazovku (rozhoduje `nextGuide`), volající ji
 * umisťuje mimo CTA a tab bar. Tap kamkoli na bublinu = zmizí. Jediná plocha ve stylu `raised` (o tón výš),
 * žádný akcent: důležitost nese poloha, ne barva. Nástup jemný (Reveal); detaily pohybu = motion-agent.
 */
export function GuideBubble({ id, onDismiss, arrow, align = 'center', delay = 0, play = true }: Props) {
  const { c, space, radius, size } = useTheme();
  const text = copy.guide[id];
  const alignSelf = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';
  const arrowView = <DotArrow dir={arrow} style={{ alignSelf, marginHorizontal: size.tilePad }} />;
  return (
    <Reveal play={play} delay={delay} rise={arrow === 'up' ? -space.s : space.s} config={motion.reveal} style={{ alignSelf: 'stretch', pointerEvents: play ? 'box-none' : 'none' }}>
      {arrow === 'up' ? arrowView : null}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint={copy.guide.dismissA11y}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => ({
          minHeight: size.hit, alignSelf,
          flexDirection: 'row', alignItems: 'center', gap: space.s,
          paddingHorizontal: space.m, paddingVertical: space.s,
          backgroundColor: pressed ? c.tile : c.tilePressed,
          borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        })}
      >
        <Text variant="label" tone="muted">{copy.guide.kicker}</Text>
        <Text variant="pill" style={{ flexShrink: 1 }}>{text.toUpperCase()}</Text>
      </Pressable>
      {arrow === 'down' ? arrowView : null}
    </Reveal>
  );
}

/** Tečková šipka: hrot ze tří teček a dřík `dots.guide.count` slábnoucích teček (Nothing Dot, bez čar). */
function DotArrow({ dir, style }: { dir: 'up' | 'down'; style?: object }) {
  const { c } = useTheme();
  const { d, gap, count } = dots.guide;
  const dot = { width: d, height: d, borderRadius: d / 2, backgroundColor: c.text };
  const head = (
    <View key="head" style={{ flexDirection: 'row', gap: d + gap * 2 }}>
      <View style={dot} /><View style={dot} />
    </View>
  );
  const tip = <View key="tip" style={dot} />;
  // Dřík slábne směrem od cíle (count…1 / count), hrot = špička + dvě tečky pod ní („^“).
  const shaft = Array.from({ length: count }, (_, i) => <View key={i} style={[dot, { opacity: (count - i) / (count + 1) }]} />);
  const items = dir === 'up' ? [tip, head, ...shaft] : [...shaft.reverse(), head, tip];
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[{ alignItems: 'center', gap, paddingVertical: gap }, style]}>
      {items}
    </View>
  );
}
