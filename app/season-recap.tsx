import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight, ReduceMotion, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { RecapSlide } from '@/components/season/RecapSlide';
import { SeasonBadge } from '@/components/season/SeasonBadge';
import { decimal } from '@/components/season/format';
import { Button } from '@/components/ui/Button';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { MeasureLine } from '@/components/ui/MeasureLine';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { seasonActions, useRecap, useSeasonStatus } from '@/hooks/useSeason';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import type { SeasonRecap } from '@/services/contracts';
import { useTheme } from '@/theme';
import type { MascotStage } from '@/types';

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
  const { c, space, size, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [claimed, setClaimed] = useState(claimedInitially);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { reduced } = useMotionSafe();
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
          footer={<Telemetry items={[{ key: r.before, value: decimal(ba.before), unit }, { key: r.after, value: decimal(ba.after), unit }]} />}
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
          <View style={{ gap: space.m, alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', gap: space.s, flexWrap: 'wrap' }}>
              <Button label={claimed ? r.claimed : r.claim} onPress={() => { void claim(); }} disabled={claimed || claiming} onAccent={earned} />
              <Button label={r.share} variant="secondary" onPress={shareSoon} onAccent={earned} />
            </View>
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

  // Přechod slidů: nový snímek nastoupí ve směru listování (posun 24 pt + prolnutí, timing 200 ms,
  // bez pružiny: na slide se klepe). Omezený pohyb: jen prolnutí 200 ms.
  const entering = dir === null ? undefined
    : reduced ? FadeIn.duration(motion.slide.duration).reduceMotion(ReduceMotion.Never)
      : (dir === 1 ? FadeInRight : FadeInLeft).duration(motion.slide.duration).easing(motion.slide.easing)
        .withInitialValues({ opacity: 0, transform: [{ translateX: dir * motion.slideShift }] });
  // Plocha oslavy (akcent u splněné odměny) se prolne stejným taktem jako snímek, ne skokem.
  const flood = useSharedValue(celebrate ? 1 : 0);
  useEffect(() => { flood.set(withTiming(celebrate ? 1 : 0, motion.slide)); }, [celebrate, flood]);
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
    <Animated.View style={[{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }, floodStyle]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingLeft: space.l, paddingRight: space.s, paddingTop: space.s }}>
        <MeasureLine
          progress={(i + 1) / total}
          label={r.progressLabel}
          value={r.progressValue(i + 1, total)}
          accessibilityLabel={r.progressA11y(i + 1, total)}
          onAccent={celebrate}
          style={{ flex: 1 }}
        />
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={r.close}
          style={{ width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center' }}
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
        <Animated.View key={slide?.key} entering={entering} style={{ flex: 1 }}>{slide?.render()}</Animated.View>
        {/* Tap zóny nejsou pro čtečku dosažitelné: tiché šipky 44 pt jsou explicitní ovládání. */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.s }}>
          <NavButton label={r.prev} disabled={i === 0} onPress={prev} onAccent={celebrate} />
          <NavButton label={r.next} disabled={i === total - 1} onPress={next} onAccent={celebrate} />
        </View>
      </View>
    </Animated.View>
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
