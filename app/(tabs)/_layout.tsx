import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarRange, CircleUser, Dumbbell, Trophy, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { feedback } from '@/lib/feedback';
import { isNavigationGuarded } from '@/lib/navGuard';
import { useTheme } from '@/theme';

const SHOW_TAB_BAR = true;

const TABS: { name: string; title: string; Icon: LucideIcon }[] = [
  { name: 'index', title: copy.tabs.training, Icon: Dumbbell },
  { name: 'league', title: copy.tabs.league, Icon: Trophy },
  { name: 'progress', title: copy.tabs.progress, Icon: TrendingUp },
  { name: 'season', title: copy.tabs.season, Icon: CalendarRange },
  { name: 'profile', title: copy.tabs.profile, Icon: CircleUser },
];

/** Tab bar (Teplá litina §2.7): `base`, vlasová linka `rule` nahoře, Lucide 24 / 1.5, popisek `tab`
 *  sentence case bez oříznutí. Aktivní = `text` + tečka 4 pt `accentGraphic` 4 pt nad ikonou;
 *  neaktivní = `muted` a tečka se nevykreslí vůbec. Barvy jsou explicitní, systémový tint se nepoužije. */
export default function TabsLayout() {
  const gate = useRequireProfile();
  const { c, size, space, stroke, radius } = useTheme();
  const insets = useSafeAreaInsets();
  if (gate === 'missing') return <Redirect href="/onboarding/path" />;
  return (
    <Tabs
      screenListeners={{
        tabPress: (e) => {
          if (isNavigationGuarded()) { e.preventDefault(); return; }
          feedback('tab');
        },
      }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.base },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        tabBarActiveBackgroundColor: c.base,
        tabBarInactiveBackgroundColor: c.base,
        tabBarStyle: SHOW_TAB_BAR
          ? {
            height: size.tabBar + insets.bottom,
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
          options={{
            title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ focused }) => (
              <View style={{ width: size.tabIcon, height: size.tabIcon, alignItems: 'center' }}>
                {focused ? (
                  <View
                    style={{
                      position: 'absolute', top: -(size.tabDot + space.xs), width: size.tabDot, height: size.tabDot,
                      borderRadius: radius.full, backgroundColor: c.accentGraphic,
                    }}
                  />
                ) : null}
                <Icon size={size.tabIcon} color={focused ? c.text : c.muted} strokeWidth={stroke.icon} />
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text variant="tab" style={{ color: focused ? c.text : c.muted }}>{title}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
