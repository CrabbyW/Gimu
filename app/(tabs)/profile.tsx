import { router } from 'expo-router';
import { ChevronRight, Medal, Settings, Shirt } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ProfileFrame } from '@/components/cosmetics/ProfileFrame';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stat } from '@/components/ui/Stat';
import { TabHeader } from '@/components/ui/TabHeader';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { usePathOptions } from '@/hooks/useOnboardingDraft';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
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

  return (
    <ScrollView contentContainerStyle={{ padding: space.l, paddingBottom: space.xxl, gap: space.xl }}>
      <View style={{ alignItems: 'center' }}>
        <ProfileFrame frameId={profile.equipped.profileFrame} size={MASCOT_SIZES.L}>
          <Mascot stage={stage} mood="idle" size="L" cosmetics={profile.equipped} accessibilityLabel={copy.mascot.label.idle} />
        </ProfileFrame>
      </View>

      <View style={{ gap: space.m }}>
        <Stat label={copy.profile.xp} value={stats?.totalXp ?? 0} unit={copy.league.xp} size="L" />
        <Telemetry
          items={[
            { key: copy.profile.stage, value: stage },
            { key: copy.profile.path, value: pathName },
            { key: copy.profile.streak, value: stats?.streak ?? 0, unit: copy.profile.days },
          ]}
        />
      </View>

      <View style={{ gap: space.m }}>
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
      </View>

      <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
        <LinkRow label={copy.profile.wardrobe} icon={<Shirt size={size.icon} color={c.text} strokeWidth={stroke.icon} />} onPress={() => router.push('/wardrobe')} />
        <LinkRow label={copy.profile.settings} icon={<Settings size={size.icon} color={c.text} strokeWidth={stroke.icon} />} onPress={() => router.push('/settings')} />
      </View>
    </ScrollView>
  );
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
