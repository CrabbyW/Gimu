import { Tabs } from 'expo-router/js-tabs';
import { Dumbbell } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { typography, useTheme } from '@/theme';

// Plán A má jediný tab (Trénink), lišta s jednou položkou nic nenaviguje, proto je skrytá.
// Plán B přidá Ligu, Progres a Profil a přepne tuhle konstantu na true.
const SHOW_TAB_BAR = false;
const TAB_BAR_HEIGHT = 64;

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.base },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: typography.label,
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
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.training,
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
