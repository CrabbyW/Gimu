import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import Animated, { ReduceMotion, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { RecapSlide } from '@/components/season/RecapSlide';
import { SeasonBadge } from '@/components/season/SeasonBadge';
import { decimal } from '@/components/season/format';
import { Reveal } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { PillButton } from '@/components/ui/PillButton';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { seasonActions, useRecap, useSeasonStatus } from '@/hooks/useSeason';
import { haptics } from '@/lib/haptics';
import { intro, motion } from '@/lib/motion';
import type { SeasonRecap } from '@/services/contracts';
import { dots, opacity, useTheme } from '@/theme';
import type { MascotStage } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';

const r = copy.recap;

function close() {
  if (router.canGoBack()) router.back(); else router.replace('/(tabs)/season');
}

/** Sdílení je placeholder. RN Web `Alert` nic nezobrazí, proto na webu `alert`. */
function shareSoon() {
  // TODO(fáze 2/4): sdílení recapu (obrázek slidu přes systémový share sheet).
  if (Platform.OS === 'web') globalThis.alert(r.shareSoon);
  else Alert.alert(r.shareSoon);
}

/** Recap sezóny (Task 25): 4–5 celoobrazovkových snímků, tap vlevo zpět, vpravo dál, swipe vodorovně. */
export default function SeasonRecapScreen() {
  const { seasonId: raw } = useLocalSearchParams<{ seasonId?: string | string[] }>();
  const seasonId = Array.isArray(raw) ? raw[0] : raw;
  const recap = useRecap(seasonId);
  const status = useSeasonStatus();
  if (!seasonId) return <ErrorState what={r.errorWhat} actionLabel={copy.common.back} onRetry={close} />;
  if (recap.status === 'loading' || status.status === 'loading') return <DotLoaderScreen />;
  if (recap.status === 'error') return <ErrorState what={r.errorWhat} onRetry={recap.retry} />;
  if (status.status === 'error') return <ErrorState what={r.errorWhat} onRetry={status.retry} />;
  const season = status.data?.season.id === seasonId ? status.data : null;
  return (
    <RecapDeck
      seasonId={seasonId}
      seasonName={season?.season.name ?? ''}
      recap={recap.data}
      claimedInitially={season?.claimed ?? false}
    />
  );
}

interface Slide { key: string; celebrate: boolean; render(): ReactNode }

function RecapDeck({ seasonId, seasonName, recap, claimedInitially }: { seasonId: string; seasonName: string; recap: SeasonRecap; claimedInitially: boolean }) {
  const { c, space, size, stroke, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [claimed, setClaimed] = useState(claimedInitially);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const profile = useProfile();
  // Směr posledního listování (null = první snímek při otevření, ten nenastupuje).
  const [dir, setDir] = useState<1 | -1 | null>(null);

  const claim = async () => {
    if (claimed || claiming) return;
    setClaiming(true); setClaimError(false);
    try {
      await seasonActions.claimReward(seasonId);
      setClaimed(true);
      haptics.success();
    } catch {
      setClaimError(true);
    } finally {
      setClaiming(false);
    }
  };

  const slides: Slide[] = [];
  const ba = recap.beforeAfter;
  if (ba) {
    const label = ba.kind === 'milestone' ? ba.label : r.labels[ba.kind];
    const unit = r.units[ba.unit];
    slides.push({
      key: 'beforeAfter', celebrate: false,
      render: () => (
        <RecapSlide
          kicker={r.beforeAfter}
          value={decimal(ba.after)}
          unit={unit}
          line={label}
          footer={
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.l, rowGap: space.xs }}>
              <Text variant="label" tone="muted">{r.beforeAfterValue(r.before, decimal(ba.before), unit)}</Text>
              <Text variant="label">{r.beforeAfterValue(r.after, decimal(ba.after), unit)}</Text>
            </View>
          }
        />
      ),
    });
  }
  slides.push({ key: 'lessons', celebrate: false, render: () => <RecapSlide kicker={r.lessons} value={recap.lessons} unit={r.units.lessons} line={r.lessonsLine} /> });
  slides.push({ key: 'streak', celebrate: false, render: () => <RecapSlide kicker={r.streak} value={recap.longestStreak} unit={r.streakUnit(recap.longestStreak)} line={r.streakLine} /> });
  slides.push({ key: 'growth', celebrate: false, render: () => <GrowthSlide from={recap.stageStart} to={recap.stageEnd} /> });
  const earned = recap.rewardEarned;
  const outfit = recap.rewardCosmeticIds[0];
  // Konzistence s mapou: opice nese nasazenou kosmetiku; při splnění si navíc obleče šálu (slot outfit).
  const equipped = profile.status === 'ready' && profile.data ? profile.data.equipped : {};
  const rewardLook = earned && outfit ? { ...equipped, outfit } : equipped;
  slides.push({
    key: 'reward', celebrate: earned,
    render: () => (
      <RecapSlide
        kicker={r.reward}
        onAccent={earned}
        line={earned ? r.rewardEarned : r.rewardMissed}
        footer={
          <View style={{ gap: space.s }}>
            <PillButton label={claimed ? r.claimed : r.claim} onPress={() => { void claim(); }} disabled={claimed} loading={claiming} onAccent={earned} />
            <PillButton label={r.share} variant="secondary" onPress={shareSoon} onAccent={earned} />
            {claimError ? <Text variant="caption" accessibilityRole="alert" style={{ color: earned ? c.onAccent : c.danger }}>{r.claimError}</Text> : null}
          </View>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.l }}>
          <Mascot stage={recap.stageEnd} mood={earned ? 'celebrate' : 'idle'} size="L" cosmetics={rewardLook} />
          {seasonName ? <SeasonBadge seasonName={seasonName} large onAccent={earned} /> : null}
        </View>
      </RecapSlide>
    ),
  });

  const total = slides.length;
  const i = Math.min(index, total - 1);
  const slide = slides[i];
  const celebrate = slide?.celebrate ?? false;
  const next = () => { if (i < total - 1) { setDir(1); setIndex(i + 1); } };
  const prev = () => { if (i > 0) { setDir(-1); setIndex(i - 1); } };

  // Přechod slidů: nový snímek nastoupí ve směru listování (posun `slideShift` + prolnutí, timing 200 ms,
  // bez pružiny: na slide se klepe). První snímek nastoupí zdvihem po přechodu modalu. Reveal (shared value),
  // ne layout `entering` FadeInLeft/Right: ten na webu nechával obal `absolute`. Omezený pohyb: prolnutí 200 ms.
  const slideIn = dir === null
    ? { delay: intro.modal.at, rise: intro.modal.rise, shift: 0 }
    : { delay: 0, rise: 0, shift: dir * motion.slideShift };
  // Plocha oslavy (akcent u splněné odměny) se prolne stejným taktem jako snímek, ne skokem; barva není pohyb,
  // proto i s omezeným pohybem (jinak by celá plocha bleskla z černé na akcent).
  const flood = useSharedValue(celebrate ? 1 : 0);
  useEffect(() => { flood.set(withTiming(celebrate ? 1 : 0, { ...motion.slide, reduceMotion: ReduceMotion.Never })); }, [celebrate, flood]);
  const floodStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(flood.value, [0, 1], [c.base, c.accent]) }));

  // Tap: levá třetina zpět, zbytek dál (čte se jako „pokračovat“). Swipe: vodorovný tah delší než 44 pt.
  const onRelease = (e: GestureResponderEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const dx = e.nativeEvent.pageX - s.x; const dy = e.nativeEvent.pageY - s.y;
    if (Math.abs(dx) > size.hit && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); return; }
    if (Math.abs(dx) < space.s && Math.abs(dy) < space.s) { if (s.x < width / 3) prev(); else next(); }
  };

  return (
    <Animated.View style={[{ flex: 1 }, floodStyle]}>
      {/* Reaktivní tečkové pozadí za snímky (celá obrazovka, jedno plátno). Na oslavné ploše (inverze) se nekreslí:
          zhasnuté tečky by na plné `text` ploše četly jako šum. */}
      <ReactiveBackground visible={!celebrate} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingLeft: space.l, paddingRight: space.l, paddingTop: space.s }}>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={r.progressA11y(i + 1, total)} style={{ flex: 1, gap: space.s }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="label" tone={celebrate ? 'onAccent' : 'muted'}>{r.progressLabel}</Text>
            <Text variant="label" tone={celebrate ? 'onAccent' : 'text'}>{r.progressValue(i + 1, total)}</Text>
          </View>
          <RecapDots total={total} at={i} onAccent={celebrate} />
        </View>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={r.close}
          style={({ pressed }) => ({
            width: size.iconButton, height: size.iconButton, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
            backgroundColor: celebrate ? 'transparent' : pressed ? c.tilePressed : c.tile,
            borderWidth: StyleSheet.hairlineWidth, borderColor: celebrate ? c.onAccent : c.edge,
          })}
        >
          <X size={size.icon} color={celebrate ? c.onAccent : c.text} strokeWidth={stroke.icon} />
        </Pressable>
      </View>
      <View
        style={{ flex: 1 }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; }}
        onResponderRelease={onRelease}
        onResponderTerminate={() => { touch.current = null; }}
      >
        <Reveal key={slide?.key} play delay={slideIn.delay} rise={slideIn.rise} shift={slideIn.shift} config={motion.slide} style={{ flex: 1 }}>
          {slide?.render()}
        </Reveal>
        {/* Tap zóny nejsou pro čtečku dosažitelné: tiché šipky 44 pt jsou explicitní ovládání. */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.s }}>
          <NavButton label={r.prev} disabled={i === 0} onPress={prev} onAccent={celebrate} />
          <NavButton label={r.next} disabled={i === total - 1} onPress={next} onAccent={celebrate} />
        </View>
      </View>
      </ReactiveBackground>
    </Animated.View>
  );
}

/** Pozice v recapu: jedna tečka = jeden snímek, rozsvícené do aktuálního (jazyk `DotRow`). Z View, ne Skia:
 *  na oslavné ploše se barvy obrací (`onAccent`), což tečková plátna neumí. */
function RecapDots({ total, at, onAccent }: { total: number; at: number; onAccent: boolean }) {
  const { c, radius } = useTheme();
  const d = dots.row.d;
  return (
    <View style={{ flexDirection: 'row', gap: dots.row.gap }}>
      {Array.from({ length: total }, (_, k) => {
        const lit = k <= at;
        const color = onAccent ? c.onAccent : lit ? c.text : c.dotOff;
        return <View key={k} style={{ width: d, height: d, borderRadius: radius.full, backgroundColor: color, opacity: onAccent && !lit ? opacity.disabled : 1 }} />;
      })}
    </View>
  );
}

/** Tichá šipka předchozí/další (44 pt): ovládání pro čtečku a pro ty, kdo tap zóny neobjeví. */
function NavButton({ label, disabled, onPress, onAccent }: { label: string; disabled: boolean; onPress(): void; onAccent: boolean }) {
  const { c, size, stroke } = useTheme();
  if (disabled) return <View style={{ width: size.hit, height: size.hit }} />;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center' }}
    >
      {label === r.prev
        ? <ChevronLeft size={size.icon} color={onAccent ? c.onAccent : c.muted} strokeWidth={stroke.icon} />
        : <ChevronRight size={size.icon} color={onAccent ? c.onAccent : c.muted} strokeWidth={stroke.icon} />}
    </Pressable>
  );
}

function GrowthSlide({ from, to }: { from: MascotStage; to: MascotStage }) {
  const { space } = useTheme();
  const name = (s: MascotStage) => copy.stageUp.label(s, copy.stageUp.names[s]);
  return (
    <RecapSlide kicker={r.growth} line={from === to ? r.growthSame : r.growthLine(name(from), name(to))}>
      {/* Výjimka §6.8: maskot smí na střed. Dvě opice ve stejné velikosti, rozdíl nese silueta stage. */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: space.l }}>
        <Mascot stage={from} mood="idle" size="M" cosmetics={{}} accessibilityLabel={name(from)} />
        <Mascot stage={to} mood={to > from ? 'happy' : 'idle'} size="M" cosmetics={{}} accessibilityLabel={name(to)} />
      </View>
    </RecapSlide>
  );
}
