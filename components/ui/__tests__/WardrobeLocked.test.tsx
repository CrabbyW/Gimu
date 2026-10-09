import TestRenderer, { act } from 'react-test-renderer';
import WardrobeScreen from '@/app/wardrobe';
import { copy } from '@/data/copy';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
/* eslint-enable @typescript-eslint/no-require-imports */
jest.mock('@/lib/feedback', () => ({ feedback: jest.fn() }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), navigate: jest.fn(), canGoBack: () => true } }));
jest.mock('@/components/dots', () => ({
  IntentScrollView: ({ children, testID }: { children?: unknown; testID?: string }) => {
    const { View } = jest.requireActual('react-native');
    return <View testID={testID}>{children as React.ReactNode}</View>;
  },
  DotRow: () => null, DotField: () => null, useDotTouch: () => ({ gesture: undefined }),
}));
jest.mock('@/components/mascot', () => ({ Mascot: () => null }));
let mockActivity: { lessonId: string }[] = [];
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ status: 'ready', data: { activity: mockActivity, guideSeen: true, equipped: {} } }),
}));
jest.mock('@/hooks/useSeason', () => ({ useSeasonStatus: () => ({ status: 'loading' }) }));
jest.mock('@/hooks/useProfileStats', () => ({ useProfileStats: () => ({ stage: 1 }) }));
jest.mock('@/hooks/useWardrobe', () => ({ useWardrobe: () => ({ status: 'loading', retry: jest.fn() }), wardrobeActions: {} }));

const render = () => {
  let r: TestRenderer.ReactTestRenderer | null = null;
  act(() => { r = TestRenderer.create(<ThemeContext.Provider value={buildTheme('dark', null)}><WardrobeScreen /></ThemeContext.Provider>); });
  return r!;
};

describe('/wardrobe a progresivní odhalení (QA U4)', () => {
  test('zamčený šatník ukáže FeatureLocked, ne obsah', () => {
    mockActivity = [{ lessonId: 'bc-1-1' }];
    const r = render();
    expect(r.root.findAll((n) => n.props.testID === 'feature-locked').length).toBeGreaterThan(0);
    const t = r.root.findAll((n) => typeof n.props.children === 'string').map((n) => n.props.children as string);
    expect(t).toContain(copy.disclosure.what.wardrobe);
    act(() => r.unmount());
  });
  test('po 2 lekcích je šatník otevřený', () => {
    mockActivity = [{ lessonId: 'bc-1-1' }, { lessonId: 'bc-1-2' }];
    const r = render();
    expect(r.root.findAll((n) => n.props.testID === 'feature-locked')).toHaveLength(0);
    act(() => r.unmount());
  });
});
