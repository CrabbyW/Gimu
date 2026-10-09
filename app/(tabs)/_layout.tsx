import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarRange, CircleUser, Dumbbell, Lock, Trophy, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingTabBar, tabBarClearance } from '@/components/ui/FloatingTabBar';
import { copy } from '@/data/copy';
import { useDisclosure, type Feature } from '@/hooks/useDisclosure';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { feedback } from '@/lib/feedback';
import { isNavigationGuarded } from '@/lib/navGuard';
import { useTheme } from '@/theme';

const TABS: { name: string; title: string; Icon: LucideIcon; feature?: Feature }[] = [
  { name: 'index', title: copy.tabs.training, Icon: Dumbbell },
  { name: 'league', title: copy.tabs.league, Icon: Trophy, feature: 'league' },
  { name: 'progress', title: copy.tabs.progress, Icon: TrendingUp },
  { name: 'season', title: copy.tabs.season, Icon: CalendarRange, feature: 'season' },
  { name: 'profile', title: copy.tabs.profile, Icon: CircleUser },
];

/** Taby s plovoucí pilulkou (Nothing Dot §2.3, `FloatingTabBar`). Scény dostanou spodní odsazení o výšku
 *  pilulky, mezery a safe area, takže obsah pod pilulkou nezmizí. Guard navigace a haptika `tab` jsou
 *  v `screenListeners` (pilulka emituje `tabPress`). */
export default function TabsLayout() {
  const gate = useRequireProfile();
  const { c, size, space, stroke, radius } = useTheme();
  const insets = useSafeAreaInsets();
  // UX pass U4: zamčený tab zůstává na svém místě (stabilní lišta), ikona `faint` (grafika ≥ 3:1) + malý zámek;
  // čtečka ohlásí „locked, unlocks after N more lessons“. Ťuknutí otevře klidnou pozvánku, ne prázdno.
  const disclosure = useDisclosure();
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
      {TABS.map(({ name, title, Icon, feature }) => {
        const gate = feature ? disclosure.gate(feature) : null;
        const locked = gate !== null && !gate.open;
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarAccessibilityLabel: locked ? copy.disclosure.tabA11y(title, gate.left) : title,
              tabBarIcon: ({ color, focused }) => (
                <View testID={locked ? `tab-locked-${name}` : undefined}>
                  <Icon size={size.tabIcon} color={locked && !focused ? c.faint : color} strokeWidth={stroke.icon} />
                  {locked ? (
                    <View style={{ position: 'absolute', right: -size.tabLock / 2, bottom: -size.tabLock / 4, backgroundColor: focused ? c.tilePressed : c.tile, borderRadius: radius.full }}>
                      <Lock size={size.tabLock} color={c.faint} strokeWidth={stroke.icon} />
                    </View>
                  ) : null}
                </View>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
