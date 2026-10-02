import { router } from 'expo-router';
import { ChevronRight, Medal, Settings, Shirt } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { ProfileFrame } from '@/components/cosmetics/ProfileFrame';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stat } from '@/components/ui/Stat';
import { TabHeader } from '@/components/ui/TabHeader';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useCountUp } from '@/hooks/useCountUp';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { ease, intro, motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { UserProfile } from '@/types';

export default function ProfileScreen() {
  const { c } = useTheme();
  const profile = useProfile();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.profile} />
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

  return (
    <ScrollView contentContainerStyle={{ padding: space.l, paddingBottom: space.xxl, gap: space.xl }}>
      <View style={{ alignItems: 'center' }}>
        <FrameIn play={first}>
          {(mascotStyle) => (
            <ProfileFrame frameId={profile.equipped.profileFrame} size={MASCOT_SIZES.L}>
              <Animated.View style={mascotStyle}>
                <Mascot stage={stage} mood="idle" size="L" cosmetics={profile.equipped} accessibilityLabel={copy.mascot.label.idle} />
              </Animated.View>
            </ProfileFrame>
          )}
        </FrameIn>
      </View>

      <View style={{ gap: space.m }}>
        <Reveal play={first} delay={P.xpAt} rise={T.rise}>
          <Stat label={copy.profile.xp} value={xpShown} a11yValue={xp} unit={copy.league.xp} size="L" />
        </Reveal>
        <Reveal play={first} delay={P.xpAt + T.step} rise={T.rise}>
        <Telemetry
          items={[
            { key: copy.profile.stage, value: stage },
            { key: copy.profile.path, value: pathName },
            { key: copy.profile.streak, value: stats?.streak ?? 0, unit: copy.profile.days },
          ]}
        />
        </Reveal>
      </View>

      <Reveal play={first} delay={P.xpAt + T.step * 2} rise={T.rise} style={{ gap: space.m }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{copy.profile.badges}</Text>
        {profile.badges.length === 0 ? (
          <Text variant="body" tone="muted">{copy.profile.noBadges}</Text>
        ) : (
          <View accessible accessibilityLabel={copy.profile.badgeCount(profile.badges.length)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s, alignItems: 'center' }}>
            {profile.badges.map((b) => (
              <View key={b} style={{ width: size.hit, height: size.hit, borderRadius: size.hit / 2, backgroundColor: c.seasonGold, alignItems: 'center', justifyContent: 'center' }}>
                <Medal size={size.icon} color={c.onSeasonGold} strokeWidth={stroke.icon} />
              </View>
            ))}
            <Text variant="label" tone="muted">{copy.profile.badgeCount(profile.badges.length)}</Text>
          </View>
        )}
      </Reveal>

      <Reveal play={first} delay={P.xpAt + T.step * 3} rise={T.rise} style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <LinkRow label={copy.profile.wardrobe} icon={<Shirt size={size.icon} color={c.text} strokeWidth={stroke.icon} />} onPress={() => router.push('/wardrobe')} />
        <LinkRow label={copy.profile.settings} icon={<Settings size={size.icon} color={c.text} strokeWidth={stroke.icon} />} onPress={() => router.push('/settings')} />
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
