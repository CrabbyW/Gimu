import { useEffect, useRef } from 'react';
import { feedback } from '@/lib/feedback';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import type { GuideId } from '@/logic/guide';
import { dur, ease, guideArrow as GA, motion, overlayResize, useMotionSafe } from '@/lib/motion';
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
  /** true = bublina odchází (už je zapsaná jako viděná): prolne se pryč, volající ji pak odmontuje. */
  leaving?: boolean;
  /** Přepis věty (např. lekce podle typu cviku); jinak `copy.guide[id]`. */
  text?: string;
  /** Nízký displej: bez štítku MONKEY, věta se vejde na jeden řádek. */
  compact?: boolean;
  /** Plovoucí šipka (nízký displej): nezabírá výšku, visí pod bublinou posunutá o tolik pt od středu, takže
   *  obejde opičku na kotouči a míří na jeho hranu. Bez hodnoty šipka stojí v toku pod/nad bublinou. */
  arrowOffset?: number;
  /** Bublina přes celou šířku: plně zakryje vše, co pod překryvem projíždí (žádný useknutý text vedle ní). */
  stretch?: boolean;
}

const NEVER = { reduceMotion: ReduceMotion.Never };

/**
 * Opička průvodce (elite fáze 1, spec §2.4): malá dlaždice s mono štítkem MONKEY a jednou větou v mono,
 * tečková šipka (sloupec teček + hrot) míří k cíli. Max. 1 na obrazovku (rozhoduje `nextGuide`), volající ji
 * umisťuje mimo CTA a tab bar. Tap kamkoli na bublinu = zmizí. Jediná plocha ve stylu `raised` (o tón výš),
 * žádný akcent: důležitost nese poloha, ne barva. Nástup jemný (Reveal); detaily pohybu = motion-agent.
 */
export function GuideBubble({ id, onDismiss, arrow, align = 'center', delay = 0, play = true, leaving = false, text: override, compact = false, arrowOffset, stretch = false }: Props) {
  const { c, space, radius, size } = useTheme();
  const text = override ?? copy.guide[id];
  const alignSelf = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';
  const floating = arrowOffset !== undefined;
  const arrowW = dots.guide.d * 3 + dots.guide.gap * 2;
  const arrowView = floating ? null : <DotArrow dir={arrow} play={play} delay={delay} style={{ alignSelf, marginHorizontal: size.tilePad }} />;
  // Odchod: prolnutí `overlayResize.outMs` (výšku pak plynule dorovná volající, mapa neposkočí).
  const out = useSharedValue(1);
  // Nástup: jeden tichý tik, když se bublina poprvé ukáže (po `delay` Reveal); jen jednou za mount.
  const announced = useRef(false);
  useEffect(() => {
    if (!play || leaving || announced.current) return;
    const t = setTimeout(() => { announced.current = true; feedback('guideShow'); }, delay);
    return () => clearTimeout(t);
  }, [play, leaving, delay]);
  useEffect(() => {
    if (leaving) out.value = withTiming(0, { duration: overlayResize.outMs, easing: ease.exit, ...NEVER });
  }, [leaving, out]);
  const outStyle = useAnimatedStyle(() => ({ opacity: out.value }));
  return (
    <Animated.View style={[{ alignSelf: 'stretch', pointerEvents: leaving ? 'none' : 'box-none' }, outStyle]}>
    <Reveal play={play} delay={delay} rise={arrow === 'up' ? -space.s : space.s} config={motion.reveal} style={{ alignSelf: 'stretch', pointerEvents: play ? 'box-none' : 'none' }}>
      {arrow === 'up' ? arrowView : null}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint={copy.guide.dismissA11y}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => ({
          minHeight: size.hit, alignSelf: stretch ? 'stretch' : alignSelf,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.s,
          paddingHorizontal: space.m, paddingVertical: space.s,
          backgroundColor: pressed ? c.tile : c.tilePressed,
          borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        })}
      >
        {compact ? null : <Text variant="label" tone="muted">{copy.guide.kicker}</Text>}
        <Text variant="pill" style={{ flexShrink: 1 }}>{text.toUpperCase()}</Text>
      </Pressable>
      {arrow === 'down' ? arrowView : null}
      {floating ? (
        <DotArrow
          dir={arrow}
          play={play}
          delay={delay}
          style={{ position: 'absolute', [arrow === 'down' ? 'top' : 'bottom']: '100%', left: '50%', marginLeft: arrowOffset - arrowW / 2, pointerEvents: 'none' }}
        />
      ) : null}
    </Reveal>
    </Animated.View>
  );
}

/** Tečková šipka: hrot ze tří teček a dřík `dots.guide.count` slábnoucích teček (Nothing Dot, bez čar).
 *  Pohyb (dluh Task 3): po nástupu bubliny se tečky rozsvítí jedna po druhé od bubliny k cíli (sken
 *  `GA.scanStepMs` na tečku), pak jednou za `GA.idleMs` šipkou přeběhne světlo stejným směrem. Omezený pohyb: statická. */
function DotArrow({ dir, play, delay, style }: { dir: 'up' | 'down'; play: boolean; delay: number; style?: object }) {
  const { reduced } = useMotionSafe();
  const { gap, count } = dots.guide;
  const n = count + 2; // dřík + hlava + špička
  // `lit`: kolik teček (od bubliny) už svítí; `wave`: poloha přebíhajícího světla (−1 = mimo).
  const lit = useSharedValue(reduced ? n : 0);
  const wave = useSharedValue(-1);
  useEffect(() => {
    if (!play) return;
    if (reduced) { lit.value = n; return; }
    const start = delay + dur.enter;
    lit.value = withDelay(start, withTiming(n, { duration: GA.scanStepMs * n, easing: Easing.linear, ...NEVER }));
    wave.value = withDelay(start + GA.scanStepMs * n, withRepeat(withSequence(
      withDelay(GA.idleMs, withTiming(n + 1, { duration: GA.pulseMs, easing: ease.sine, ...NEVER })),
      withTiming(-1, { duration: 0, ...NEVER }),
    ), -1, false));
    return () => { cancelAnimation(lit); cancelAnimation(wave); };
  }, [play, reduced, delay, n, lit, wave]);
  // Pořadí od bubliny: dřík (od nejslabší tečky) → hlava → špička. Síla dříku slábne směrem od cíle.
  const shaft = Array.from({ length: count }, (_, i) => (
    <ScanDot key={i} order={count - 1 - i} base={(count - i) / (count + 1)} lit={lit} wave={wave} />
  ));
  const head = (
    <View key="head" style={{ flexDirection: 'row', gap: dots.guide.d + gap * 2 }}>
      <ScanDot order={count} base={1} lit={lit} wave={wave} /><ScanDot order={count} base={1} lit={lit} wave={wave} />
    </View>
  );
  const tip = <ScanDot key="tip" order={count + 1} base={1} lit={lit} wave={wave} />;
  const items = dir === 'up' ? [tip, head, ...shaft] : [...shaft.reverse(), head, tip];
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[{ alignItems: 'center', gap, paddingVertical: gap }, style]}>
      {items}
    </View>
  );
}

/** Jedna tečka šipky: rozsvítí se, když ji sken mine; přebíhající světlo ji krátce rozsvítí naplno. */
function ScanDot({ order, base, lit, wave }: { order: number; base: number; lit: SharedValue<number>; wave: SharedValue<number> }) {
  const { c } = useTheme();
  const { d } = dots.guide;
  const a = useAnimatedStyle(() => {
    const on = Math.min(1, Math.max(0, lit.value - order));
    const bump = Math.max(0, 1 - Math.abs(wave.value - order));
    return { opacity: on * (base + (1 - base) * bump) };
  });
  return <Animated.View style={[{ width: d, height: d, borderRadius: d / 2, backgroundColor: c.text }, a]} />;
}
