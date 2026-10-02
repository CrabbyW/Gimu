import { Cloud, Lock, Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { copy } from '@/data/copy';
import type { useWardrobe } from '@/hooks/useWardrobe';
import { opacity, useTheme } from '@/theme';
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

/** Dlaždice Šatníku: čtverec 1:1 na `surface` s náhledem položky, pod ním název a SourceBadge.
 *  Nasazená = obrys `text` 2 pt (R42: místo akcentu kontrast; jediný obrys na dlaždici). Zamčená = silueta
 *  (náhled v `opacity.locked`) se zámkem; podmínku získání nese SourceBadge. */
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
          width, height: width, borderRadius: radius.l, backgroundColor: c.surface,
          borderWidth: stroke.focus, borderColor: 'transparent',
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <View style={{ opacity: unlocked ? 1 : opacity.locked }}>
          <Preview slot={cosmetic.slot} id={cosmetic.id} stage={stage} box={width - space.l} />
        </View>
        {unlocked ? null : (
          <View style={{ position: 'absolute', top: space.s, right: space.s }}>
            <Lock size={size.badgeIcon + space.xs} color={c.muted} strokeWidth={stroke.icon} />
          </View>
        )}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[ring, { position: 'absolute', top: 0, left: 0, width, height: width, borderRadius: radius.l, borderWidth: stroke.focus, borderColor: c.text }]}
      />
      </View>
      <View style={{ gap: space.xs }}>
        <Text variant="caption" numberOfLines={2}>{cosmetic.name}</Text>
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
  // Pozadí mapy: čtvercový vzorek. Křídový prach = řídké tečky, noční posilovna = tmavá plocha s linkami.
  const s = Math.max(0, box);
  const step = s / 5;
  return (
    <Svg width={s} height={s}>
      <Rect x={0} y={0} width={s} height={s} rx={radius.s} fill={id === 'map-night-gym' ? c.shadow : c.base} />
      {id === 'map-night-gym'
        ? [1, 2, 3, 4].map((i) => <Line key={i} x1={0} x2={s} y1={i * step} y2={i * step} stroke={c.rule} strokeWidth={1} />)
        : [1, 2, 3, 4].flatMap((i) => [1, 2, 3, 4].map((j) => (
          <Circle key={`${i}-${j}`} cx={i * step + ((j % 2) * step) / 2 - step / 4} cy={j * step} r={size.loaderDot / 2} fill={c.muted} />
        )))}
    </Svg>
  );
}
