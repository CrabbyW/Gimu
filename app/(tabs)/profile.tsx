import { router } from 'expo-router';
import { ChevronRight, Shirt } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ProfileFrame } from '@/components/cosmetics/ProfileFrame';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { BadgeTile } from '@/components/ui/BadgeTile';
import { Card } from '@/components/ui/Card';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { StatGrid } from '@/components/ui/StatGrid';
import { StreakBarbell } from '@/components/ui/StreakBarbell';
import { TabHeader } from '@/components/ui/TabHeader';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { useCountUp } from '@/hooks/useCountUp';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { ease, intro, motion, useMotionSafe } from '@/lib/motion';
import { layout, useTheme } from '@/theme';
import type { UserProfile } from '@/types';

export default function ProfileScreen() {
  const { c } = useTheme();
  const profile = useProfile();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.profile} onSettings={() => router.push('/settings')} />
      {profile.status === 'loading' || (profile.status === 'ready' && !profile.data) ? <DotLoaderScreen />
        : profile.status === 'error' ? <ErrorState edges={[]} what={copy.profile.errorWhat} onRetry={profile.retry} />
          : <ProfileBody profile={profile.data!} />}
    </View>
  );
}

/** Profil (§7.8). Hierarchie: opice L v rámu (hrdina) → XP jako jediné velké číslo → telemetrie
 *  (stage, cesta, streak) → odznaky → odkazy. Řádky odkazů dělí jen hairline `rule`. */
function ProfileBody({ profile }: { profile: UserProfile }) {
  const { c, space, size, stroke } = useTheme();
  const stats = useProfileStats(profile);
  const stage = useDisplayStage(stats?.stage ?? 1);
  const pathName = usePathOptions().find((p) => p.id === profile.path)?.name ?? profile.path;
  // Motion: úvodní sled jen při prvním zobrazení tabu. Rám se rozevře, opice v něm dosedne pružinou,
  // XP napočítá (700 ms expo.out), pak telemetrie, odznaky a odkazy po 70 ms.
  const first = useFirstShow('tab:profile');
  const P = intro.profile;
  const T = intro.tab;
  const xp = stats?.totalXp ?? 0;
  const xpShown = useCountUp(xp, P.countMs, 0, { enabled: first, delayMs: P.xpAt });
  const badges = useBadgeProgress(profile);
  const streak = stats?.streak ?? 0;
  const longest = stats?.longestStreak ?? 0;
  const todayDone = stats?.todayDone ?? false;
  const { width } = useWindowDimensions();
  const stacked = width < layout.narrow;

  return (
    <ScrollView contentContainerStyle={{ padding: space.l, paddingBottom: space.xxl, gap: space.xl }}>
      {/* Hrdina: opička M v rámu vedle cesty. Pod `layout.narrow` pod sebe. */}
      <View style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', gap: space.l }}>
        <FrameIn play={first}>
          {(mascotStyle) => (
            <ProfileFrame frameId={profile.equipped.profileFrame} size={MASCOT_SIZES.M}>
              <Animated.View style={mascotStyle}>
                <Mascot stage={stage} mood="idle" size="M" cosmetics={profile.equipped} accessibilityLabel={copy.mascot.label.idle} />
              </Animated.View>
            </ProfileFrame>
          )}
        </FrameIn>
        <Text variant="body" tone="muted" style={{ flexShrink: 1 }}>{copy.profile.pathLine(pathName)}</Text>
      </View>

      {/* Karta série: jediný nositel streaku na profilu (StreakBarbell lg + číslo `display` v accentText). */}
      <Reveal play={first} delay={P.xpAt} rise={T.rise}>
        <Card style={{ gap: space.m }}>
          <SectionLabel>{copy.profile.streakLabel}</SectionLabel>
          <View
            accessible
            accessibilityLabel={streak > 0 ? (todayDone ? copy.streak.a11yDone(streak) : copy.streak.a11yPending(streak)) : copy.streak.none}
            style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center', justifyContent: 'space-between', gap: space.m }}
          >
            <StreakBarbell variant="lg" streak={streak} longest={longest} todayDone={todayDone} />
            <Text variant="display" tone={streak > 0 ? 'accent' : 'muted'}>{copy.profile.streakDays(streak)}</Text>
          </View>
          <Text variant="caption" tone="muted">
            {longest > 0 ? `${copy.streak.longest(longest)} · ${todayDone ? copy.today.done : copy.today.pending}` : copy.today.pending}
          </Text>
        </Card>
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step} rise={T.rise}>
        <StatGrid
          items={[
            { label: copy.profile.statXp, value: copy.profile.xpValue(xpShown), a11y: `${copy.profile.statXp}: ${xp}` },
            { label: copy.profile.statStage, value: copy.profile.stageValue(stage) },
          ]}
        />
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step * 2} rise={T.rise} style={{ gap: space.m }}>
        <View accessible accessibilityLabel={copy.profile.badgeRatioA11y(badges.earned, badges.total)}>
          <SectionLabel value={copy.profile.badgeRatio(badges.earned, badges.total)}>{copy.profile.badges}</SectionLabel>
        </View>
        {/* Získané první, zamčené za nimi: siluety ukazují, co dál, ne co chybí. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
          {[...badges.items].sort((a, b) => Number(b.earned) - Number(a.earned)).map((b) => (
            <BadgeTile key={b.id} name={b.name} condition={b.condition} earned={b.earned} />
          ))}
        </View>
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step * 3} rise={T.rise} style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <LinkRow label={copy.profile.wardrobe} icon={<Shirt size={size.icon} color={c.text} strokeWidth={stroke.icon} />} onPress={() => router.push('/wardrobe')} />
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

function LinkRow({ label, icon, onPress }: { label: string; icon: ReactNode; onPress(): void }) {
  const { c, space, size, stroke } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={{ minHeight: size.hitLarge, flexDirection: 'row', alignItems: 'center', gap: space.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule }}
    >
      {icon}
      <Text variant="bodyStrong" style={{ flex: 1 }}>{label}</Text>
      <ChevronRight size={size.icon} color={c.muted} strokeWidth={stroke.icon} />
    </Pressable>
  );
}
