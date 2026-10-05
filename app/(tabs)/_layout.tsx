import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarRange, CircleUser, Dumbbell, Trophy, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar, tabBarClearance } from '@/components/ui/FloatingTabBar';
import { copy } from '@/data/copy';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { feedback } from '@/lib/feedback';
import { isNavigationGuarded } from '@/lib/navGuard';
import { useTheme } from '@/theme';

const TABS: { name: string; title: string; Icon: LucideIcon }[] = [
  { name: 'index', title: copy.tabs.training, Icon: Dumbbell },
  { name: 'league', title: copy.tabs.league, Icon: Trophy },
  { name: 'progress', title: copy.tabs.progress, Icon: TrendingUp },
  { name: 'season', title: copy.tabs.season, Icon: CalendarRange },
  { name: 'profile', title: copy.tabs.profile, Icon: CircleUser },
];

/** Taby s plovoucí pilulkou (Nothing Dot §2.3, `FloatingTabBar`). Scény dostanou spodní odsazení o výšku
 *  pilulky, mezery a safe area, takže obsah pod pilulkou nezmizí. Guard navigace a haptika `tab` jsou
 *  v `screenListeners` (pilulka emituje `tabPress`). */
export default function TabsLayout() {
  const gate = useRequireProfile();
  const { c, size, space, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  if (gate === 'missing') return <Redirect href="/onboarding/path" />;
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenListeners={{
        tabPress: (e) => {
          if (isNavigationGuarded()) { e.preventDefault(); return; }
          feedback('tab');
        },
      }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.base, paddingBottom: tabBarClearance(insets.bottom, size.tabPill, space.m) },
      }}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color }) => <Icon size={size.tabIcon} color={color} strokeWidth={stroke.icon} />,
          }}
        />
      ))}
    </Tabs>
  );
}
