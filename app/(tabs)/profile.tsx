import { router } from 'expo-router';
import { ChevronRight, Settings, Shirt } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ProfileFrame } from '@/components/cosmetics/ProfileFrame';
import { DotField, useDotTouch } from '@/components/dots';
import { ReactiveMascot, useMascotReactions, useScreenFocused } from '@/components/mascot';
import { tileColumns } from '@/components/progress/layout';
import { BadgeTile } from '@/components/ui/BadgeTile';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { PlateStack, plateStackHeight } from '@/components/ui/PlateStack';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatGrid } from '@/components/ui/StatGrid';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { useCountUp } from '@/hooks/useCountUp';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { ease, intro, motion, useMotionSafe } from '@/lib/motion';
import { dots, useTheme } from '@/theme';
import type { UserProfile } from '@/types';

/** Nejvyšší stage opice (BABY · TEENAGER · ALPHA): jednotka „/ 3“ u dlaždice stage. */
const MAX_STAGE = Object.keys(copy.stageUp.names).length;
/** Opička stojí na horním kotouči: zapustí se do stohu o polovinu výšky horní elipsy. */
const topEllipse = () => dots.pedestal.sizes[dots.pedestal.sizes.length - 1]! * dots.pedestal.squash;

export default function ProfileScreen() {
  // Hlavička = první úder nástupu obrazovky (jen první zobrazení v relaci).
  const headerIn = useFirstShow('hdr:profile');
  const { c } = useTheme();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const stats = useProfileStats(data);
  const pathName = usePathOptions().find((p) => p.id === data?.path)?.name ?? data?.path ?? '';
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <ScreenHeader
        intro={headerIn}
        title={copy.tabs.profile}
        actions={[{ icon: Settings, label: copy.header.settings, onPress: () => router.push('/settings') }]}
        status={data && stats ? {
          left: copy.profile.pathStatus(pathName),
          right: copy.status.streak(stats.streak),
          live: !stats.todayDone,
          rightA11y: copy.status.streakA11y(stats.streak, stats.todayDone),
        } : undefined}
      />
      {profile.status === 'loading' || (profile.status === 'ready' && !profile.data) ? <DotLoaderScreen />
        : profile.status === 'error' ? <ErrorState edges={[]} what={copy.profile.errorWhat} onRetry={profile.retry} />
          : <ProfileBody profile={profile.data!} />}
    </View>
  );
}

/**
 * Profil (Nothing Dot fáze 2). Hierarchie: opička (jediný barevný subjekt) na tečkovém poli, stojící na stohu
 * tří tečkových kotoučů → statistiky jako dlaždice 2×N (XP jediné napočítávané číslo) → odznaky → Šatník.
 * Plátna: pole 1 + podstavec 3 = 4.
 */
function ProfileBody({ profile }: { profile: UserProfile }) {
  const { c, space, size, stroke } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const cols = tileColumns(width, fontScale);
  const stats = useProfileStats(profile);
  const stage = useDisplayStage(stats?.stage ?? 1);
  // Motion: úvodní sled jen při prvním zobrazení tabu. Rám se rozevře, opice v něm dosedne pružinou,
  // XP napočítá (700 ms expo.out), pak dlaždice, odznaky a Šatník po 70 ms.
  const first = useFirstShow('tab:profile');
  const P = intro.profile;
  const T = intro.tab;
  const xp = stats?.totalXp ?? 0;
  const xpShown = useCountUp(xp, P.countMs, 0, { enabled: first, delayMs: P.xpAt });
  const badges = useBadgeProgress(profile);
  const streak = stats?.streak ?? 0;
  const longest = stats?.longestStreak ?? 0;
  // Dotyková vlna pole za opičkou (spec §4.1); gesto jen čte dotyky, scroll nebere.
  const field = useDotTouch();
  // Opička je hratelná (fáze 3): ťuknutí, podržení, pohled za prstem po celém hero poli.
  const reactions = useMascotReactions(useScreenFocused());
  const heroTouch = useMemo(() => Gesture.Simultaneous(field.gesture, reactions.touch), [field.gesture, reactions.touch]);
  const [heroW, setHeroW] = useState(0);
  const stackH = plateStackHeight();

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.l, paddingBottom: space.xxxl, gap: space.m }}>
      {/* Hrdina: opička velká na tečkovém poli, stojí na podstavci ze tří tečkových kotoučů. */}
      <GestureDetector gesture={heroTouch}>
        <View onLayout={(e) => setHeroW(e.nativeEvent.layout.width)} style={{ height: size.profileField + stackH / 2, alignItems: 'center', justifyContent: 'flex-end' }}>
          {heroW > 0 ? (
            <DotField width={heroW} height={size.profileField} fade="up" touch={field.touch} style={{ position: 'absolute', left: 0, top: 0 }} />
          ) : null}
          <View style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: -topEllipse() / 2, zIndex: 1 }}>
              <FrameIn play={first}>
                {(mascotStyle) => (
                  <ProfileFrame frameId={profile.equipped.profileFrame} size={size.wardrobePreview}>
                    <Animated.View style={mascotStyle}>
                      <ReactiveMascot reactions={reactions} stage={stage} mood="idle" size={size.wardrobePreview} cosmetics={profile.equipped} accessibilityLabel={copy.mascot.label.idle} />
                    </Animated.View>
                  </ProfileFrame>
                )}
              </FrameIn>
            </View>
            <PlateStack play={first} delay={intro.pedestal.at} />
          </View>
        </View>
      </GestureDetector>

      <Reveal play={first} delay={P.xpAt} rise={T.rise}>
        <StatGrid
          cols={cols}
          items={[
            { value: copy.profile.xpNumber(xpShown), unit: copy.profile.xpUnit, label: copy.profile.statXp, a11y: `${copy.profile.statXp}: ${xp}` },
            { value: String(stage), unit: copy.profile.stageOf(MAX_STAGE), label: copy.profile.statStage },
            { value: String(streak), unit: copy.streak.days(streak), label: copy.profile.statStreak },
            { value: String(longest), unit: copy.streak.days(longest), label: copy.profile.statLongest },
          ]}
        />
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step} rise={T.rise}>
        <Tile style={{ gap: space.m }}>
          <View accessible accessibilityLabel={copy.profile.badgeRatioA11y(badges.earned, badges.total)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="label" tone="muted" accessibilityRole="header">{copy.profile.badges}</Text>
            <Text variant="label">{copy.profile.badgeRatio(badges.earned, badges.total)}</Text>
          </View>
          {badges.items.length === 0 ? <Text tone="muted">{copy.profile.noBadges}</Text> : (
            // Získané první, zamčené za nimi: ukazují, co dál, ne co chybí.
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
              {[...badges.items].sort((a, b) => Number(b.earned) - Number(a.earned)).map((b) => (
                <BadgeTile key={b.id} name={b.name} condition={b.condition} earned={b.earned} />
              ))}
            </View>
          )}
        </Tile>
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step * 2} rise={T.rise}>
        <Tile onPress={() => router.push('/wardrobe')} accessibilityLabel={copy.profile.wardrobe} accessibilityHint={copy.profile.wardrobeLine}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <Shirt size={size.icon} color={c.text} strokeWidth={stroke.icon} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="headline">{copy.profile.wardrobe}</Text>
              <Text variant="caption" tone="muted">{copy.profile.wardrobeLine}</Text>
            </View>
            <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
          </View>
        </Tile>
      </Reveal>
    </ScrollView>
  );
}

/** Nástup rámu: prstenec se rozevře 0.88 → 1 s prolnutím (520 ms punch, timing: rám je UI), opice v něm
 *  o 120 ms později dosedne pružinou `motion.settle` z 0.85 (fyzický prvek). Omezený pohyb: prolnutí 200 ms. */
function FrameIn({ play, children }: { play: boolean; children(mascotStyle: object): ReactNode }) {
  const { reduced } = useMotionSafe();
  const [animate] = useState(play);
  const f = useSharedValue(animate ? 0 : 1);
  const m = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    if (reduced) {
      f.value = withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never });
      m.value = 1;
      return;
    }
    f.value = withTiming(1, { duration: intro.profile.frameMs, easing: ease.punch });
    m.value = withDelay(120, withSpring(1, motion.settle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const calm = reduced;
  const frame = useAnimatedStyle(() => ({ opacity: f.value, transform: [{ scale: calm ? 1 : 0.88 + 0.12 * f.value }] }));
  const mascotStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, m.value * 1.5), transform: [{ scale: calm ? 1 : 0.85 + 0.15 * m.value }] }));
  return <Animated.View style={frame}>{children(mascotStyle)}</Animated.View>;
}
