// Tichý fallback přehrávání a tichý režim iOS (elite fáze 2, Task 2).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
const mockCreate = jest.fn();
const mockMode = jest.fn((_o: unknown) => Promise.resolve());
jest.mock('expo-audio', () => ({ createAudioPlayer: (...a: unknown[]) => mockCreate(...a), setAudioModeAsync: (o: unknown) => mockMode(o) }));

type Sound = typeof import('@/lib/sound');
const load = (): Sound => {
  let m!: Sound;
  jest.isolateModules(() => { m = require('@/lib/sound'); }); // eslint-disable-line @typescript-eslint/no-require-imports
  return m;
};

beforeEach(() => { jest.clearAllMocks(); });

test('tichý režim iOS: audio mode má playsInSilentMode false (i při ztlumení)', () => {
  mockCreate.mockReturnValue({ seekTo: () => Promise.resolve(), play: jest.fn() });
  const s = load();
  s.preloadSounds();
  s.setDucking(true); s.setDucking(false);
  expect(mockMode).toHaveBeenCalledTimes(3);
  for (const [o] of mockMode.mock.calls as unknown as [{ playsInSilentMode: boolean }][]) expect(o.playsInSilentMode).toBe(false);
});

test('chybějící přehrávač (createAudioPlayer hází): playSfx tiše nic', () => {
  mockCreate.mockImplementation(() => { throw new Error('decode'); });
  const s = load();
  expect(() => s.playSfx('success')).not.toThrow();
});

test('poškozený přehrávač (play/seekTo hází nebo chybí): playSfx tiše nic', () => {
  mockCreate.mockReturnValue({ seekTo: () => Promise.reject(new Error('x')), play: () => { throw new Error('dead'); } });
  expect(() => load().playSfx('snap')).not.toThrow();
  mockCreate.mockReturnValue({});
  expect(() => load().playSfx('tick')).not.toThrow();
});

