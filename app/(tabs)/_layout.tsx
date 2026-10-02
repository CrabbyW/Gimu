import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarRange, CircleUser, Dumbbell, Trophy, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { isNavigationGuarded } from '@/lib/navGuard';
import { typography, useCompact, useTheme } from '@/theme';

const SHOW_TAB_BAR = true;

const TABS: { name: string; title: string; Icon: LucideIcon }[] = [
  { name: 'index', title: copy.tabs.training, Icon: Dumbbell },
  { name: 'league', title: copy.tabs.league, Icon: Trophy },
  { name: 'progress', title: copy.tabs.progress, Icon: TrendingUp },
  { name: 'season', title: copy.tabs.season, Icon: CalendarRange },
  { name: 'profile', title: copy.tabs.profile, Icon: CircleUser },
];
const TAB_BAR_HEIGHT = 64;

export default function TabsLayout() {
  const gate = useRequireProfile();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const compact = useCompact();
  if (gate === 'missing') return <Redirect href="/onboarding/path" />;
  return (
    <Tabs
      screenListeners={{ tabPress: (e) => { if (isNavigationGuarded()) e.preventDefault(); } }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.base },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        // Na 320 pt by `label` (rozpal 2 pt) ořízl „TRÉNINK“/„PROGRES“; kompaktní stupeň drží celé slovo.
        tabBarLabelStyle: compact ? typography.tabLabelCompact : typography.label,
        tabBarStyle: SHOW_TAB_BAR
          ? {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: c.base,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.rule,
            elevation: 0,
            shadowOpacity: 0,
          }
          : { display: 'none' },
      }}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: ({ color, size }) => <Icon color={color} size={size} strokeWidth={1.5} /> }}
        />
      ))}
    </Tabs>
  );
}
