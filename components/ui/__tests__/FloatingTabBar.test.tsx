import TestRenderer, { act } from 'react-test-renderer';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const routes = ['index', 'league', 'progress'].map((name) => ({ key: `${name}-k`, name, params: undefined }));
const make = (emitPrevented = false) => {
  const navigation = { emit: jest.fn(() => ({ defaultPrevented: emitPrevented })), navigate: jest.fn() };
  const descriptors = Object.fromEntries(routes.map((r) => [r.key, { options: { title: r.name, tabBarIcon: () => null } }]));
  const props = {
    state: { index: 0, routes, key: 'tabs', routeNames: routes.map((r) => r.name), type: 'tab', stale: false, history: [] },
    descriptors, navigation, insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><FloatingTabBar {...props} /></ThemeContext.Provider>); });
  const tabs = r!.root.findAll((n) => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function');
  return { navigation, tabs };
};

test('tap na 2. tab emituje tabPress a naviguje na league', () => {
  const { navigation, tabs } = make();
  act(() => { tabs[1]!.props.onPress(); });
  expect(navigation.emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'tabPress', target: 'league-k' }));
  expect(navigation.navigate).toHaveBeenCalledWith('league', undefined);
});

test('zablokovaný tabPress (guard) nenaviguje', () => {
  const { navigation, tabs } = make(true);
  act(() => { tabs[1]!.props.onPress(); });
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('aktivní tab má accessibilityState.selected', () => {
  const { tabs } = make();
  expect(tabs[0]!.props.accessibilityState).toEqual({ selected: true });
  expect(tabs[1]!.props.accessibilityState).toEqual({ selected: false });
});
