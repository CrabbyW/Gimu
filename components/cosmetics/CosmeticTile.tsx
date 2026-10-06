import { Cloud, Lock, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { copy } from '@/data/copy';
import type { useWardrobe } from '@/hooks/useWardrobe';
import { dash, opacity, useTheme } from '@/theme';
import type { MascotStage } from '@/types';
import { ProfileFrame } from './ProfileFrame';
import { SourceBadge } from './SourceBadge';

export type WardrobeItem = Extract<ReturnType<typeof useWardrobe>, { status: 'ready' }>['data']['items'][number];

interface Props {
  item: WardrobeItem;
  /** Šířka dlaždice (mřížka 3 sloupce počítá z šířky obrazovky). */
  width: number;
  stage: MascotStage;
  seasonName?: string;
  disabled?: boolean;
  onPress(): void;
}

/** Dlaždice Šatníku (Nothing Dot fáze 2): čtverec 1:1, plocha `tile` + vlasová `edge`, radius 28, uvnitř
 *  náhled (mini SVG opička, ne Skia), pod ním název a SourceBadge. Nasazená = hrana `text` 2 pt přes `edge`.
 *  Zamčená = náhled v `opacity.locked`, zámek a mono „ZAMČENO“; podmínku získání nese SourceBadge. */
export function CosmeticTile({ item, width, stage, seasonName, disabled, onPress }: Props) {
  const { c, space, radius, stroke, size } = useTheme();
  const { cosmetic, unlocked, equipped, canBuy } = item;
  const buyable = !unlocked && (canBuy === 'ok' || canBuy === 'insufficient');
  const state = equipped ? copy.wardrobe.state.equipped : unlocked ? copy.wardrobe.state.unlocked : buyable ? copy.wardrobe.state.buy : copy.wardrobe.state.locked;
  const locked = !unlocked && !buyable;
  // Motion: stisk 0.97 (press 90 / release 220, bez pružiny) a obrys nasazení se prolne `motion.ui`
  // (zrušení `motion.uiExit`) místo skoku. Omezený pohyb: obojí hned (usePressFeedback: opacita).
  const feedback = usePressFeedback(0.97);
  const sel = useSelectionProgress(equipped);
  const ring = useAnimatedStyle(() => ({ opacity: sel.value }));
  return (
    <Animated.View style={feedback.style}>
    <Pressable
      onPress={onPress}
      onPressIn={feedback.onPressIn}
      onPressOut={feedback.onPressOut}
      disabled={disabled || locked}
      accessibilityRole="button"
      accessibilityLabel={copy.wardrobe.tileA11y(cosmetic.name, state)}
      accessibilityState={{ selected: equipped, disabled: disabled || locked }}
      style={{ width, gap: space.s }}
    >
      <View>
      <View
        style={{
          width, height: width, borderRadius: radius.tile, backgroundColor: c.tile,
          borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <View style={{ opacity: unlocked ? 1 : opacity.locked, marginTop: unlocked ? 0 : space.s }}>
          <Preview slot={cosmetic.slot} id={cosmetic.id} stage={stage} box={width - space.l} />
        </View>
        {/* Zamčená: zámek + mono „ZAMČENO“ (nekupovatelná) v rohu; kupovatelná jen zámek (cenu nese štítek pod dlaždicí). */}
        {unlocked ? null : (
          <View style={{ position: 'absolute', top: space.s + space.xs, left: space.s + space.xs, right: space.s, flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
            <Lock size={size.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
            {locked ? <Text variant="badgeLabel" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>{copy.wardrobe.locked}</Text> : null}
          </View>
        )}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[ring, { position: 'absolute', top: 0, left: 0, width, height: width, borderRadius: radius.tile, borderWidth: stroke.focus, borderColor: c.text }]}
      />
      </View>
      <View style={{ gap: space.xs }}>
        <Text variant="caption" tone={locked ? 'muted' : 'text'} numberOfLines={2}>{cosmetic.name}</Text>
        {equipped ? <Text variant="badgeLabel">{copy.wardrobe.equipped}</Text>
          : <SourceBadge cosmetic={cosmetic} seasonName={seasonName} owned={unlocked} />}
      </View>
    </Pressable>
    </Animated.View>
  );
}

/** Náhled podle slotu: opice s položkou (oblečení, doplněk), mini rám, vzorek pozadí mapy, ikona efektu. */
function Preview({ slot, id, stage, box }: { slot: WardrobeItem['cosmetic']['slot']; id: string; stage: MascotStage; box: number }) {
  const { c, size, stroke, radius } = useTheme();
  if (slot === 'outfit' || slot === 'accessory') {
    return <Mascot stage={stage} mood="idle" size={size.tileMascot} cosmetics={{ [slot]: id }} />;
  }
  if (slot === 'profileFrame') return <ProfileFrame frameId={id} size={Math.max(0, box - size.frameRing * 2)} />;
  if (slot === 'lessonEffect') {
    const Icon = id === 'fx-sparks' ? Sparkles : Cloud;
    return <Icon size={size.glyph} color={c.text} strokeWidth={stroke.icon} />;
  }
  // Pozadí mapy: čtvercový vzorek v tečkovém jazyce. Křídový prach = řídký posunutý rastr teček `muted`,
  // noční posilovna = tmavá plocha s hustými tečkovanými linkami `dotDim`.
  const s = Math.max(0, box);
  const step = s / 5;
  return (
    <Svg width={s} height={s}>
      <Rect x={0} y={0} width={s} height={s} rx={radius.l} fill={id === 'map-night-gym' ? c.shadow : c.base} />
      {id === 'map-night-gym'
        ? [1, 2, 3, 4].map((i) => (
          <Line key={i} x1={step / 2} x2={s - step / 2} y1={i * step} y2={i * step} stroke={c.dotDim} strokeWidth={size.loaderDot / 2} strokeLinecap="round" strokeDasharray={dash.dots} />
        ))
        : [1, 2, 3, 4].flatMap((i) => [1, 2, 3, 4].map((j) => (
          <Circle key={`${i}-${j}`} cx={i * step + ((j % 2) * step) / 2 - step / 4} cy={j * step} r={size.loaderDot / 2} fill={c.muted} />
        )))}
    </Svg>
  );
}
