import * as Haptics from 'expo-haptics';
import { feedback } from '@/lib/feedback';
import { APPROX, play, stopPattern } from '@/lib/haptics';
import { playSfx } from '@/lib/sound';
import { useSettings } from '@/store/settings';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/lib/sound', () => ({ playSfx: jest.fn() }));

beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); useSettings.setState({ hapticsEnabled: true, soundEnabled: true }); });
afterEach(() => { stopPattern(); jest.useRealTimers(); });

test('APPROX: t=0 je dopad (heavy) u oslav, kroky vzestupně, nic přes 2 s, žádný error', () => {
  for (const id of ['lesson-complete', 'milestone', 'section-unlock', 'gong'] as const) expect(APPROX[id][0]).toEqual([0, 'heavy']);
  for (const steps of Object.values(APPROX)) {
    const t = steps.map(([at]) => at);
    expect(t).toEqual([...t].sort((a, b) => a - b));
    expect(Math.max(...t)).toBeLessThanOrEqual(2000);
  }
});

test('play drží jediný aktivní vzor: nové volání zruší zbytek předchozího', () => {
  play('lesson-complete');
  jest.advanceTimersByTime(100); // heavy + rigid
  play('unlock');
  jest.advanceTimersByTime(3000);
  const impacts = (Haptics.impactAsync as jest.Mock).mock.calls.length;
  // 2 kroky z prvního vzoru + 2 z unlock; success z lesson-complete (1250 ms) nezazní.
  expect(impacts).toBe(4);
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
});

test('stopPattern je idempotentní a ruší zbytek', () => {
  play('gong'); jest.advanceTimersByTime(10); stopPattern(); stopPattern();
  jest.advanceTimersByTime(3000);
  expect((Haptics.impactAsync as jest.Mock).mock.calls.length).toBe(1);
});

test('vypnutá haptika: vzor ani feedback nevibrují, zvuk se řídí vlastním přepínačem', () => {
  useSettings.setState({ hapticsEnabled: false });
  play('lesson-complete'); jest.advanceTimersByTime(3000);
  feedback('go');
  expect(Haptics.impactAsync).not.toHaveBeenCalled();
  expect(playSfx).toHaveBeenCalledWith('plateSnap');
});

test('tapLight nemá haptiku ani zvuk; cta = medium bez zvuku', () => {
  feedback('tapLight');
  expect(Haptics.impactAsync).not.toHaveBeenCalled(); expect(playSfx).not.toHaveBeenCalled();
  feedback('cta');
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium'); expect(playSfx).not.toHaveBeenCalled();
});
