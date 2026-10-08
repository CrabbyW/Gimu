// Integrace odezvy (elite fáze 2, Task 2): feedback → haptika + zvuk, přepínače, omezovač, napojení nových id v UI.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Haptics from 'expo-haptics';
import { feedback, SFX_MIN_GAP_MS } from '@/lib/feedback';
import { playSfx } from '@/lib/sound';
import { useSettings } from '@/store/settings';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
}));
// Skutečné playSfx přes mock přehrávače: kontroluje i přepínač Zvuky uvnitř lib/sound.
const mockPlay = jest.fn();
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-audio', () => ({ createAudioPlayer: () => ({ seekTo: () => Promise.resolve(), play: () => mockPlay() }), setAudioModeAsync: () => Promise.resolve() }));

let now = 1_000_000;
beforeEach(() => {
  jest.clearAllMocks();
  now += 10_000; jest.spyOn(Date, 'now').mockImplementation(() => now);
  useSettings.setState({ hapticsEnabled: true, soundEnabled: true });
});

test("feedback('lessonDone'): success haptika i zvuk v jednom volání", () => {
  feedback('lessonDone');
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  expect(mockPlay).toHaveBeenCalledTimes(1);
});

test('vypnuté Zvuky: žádné play, haptika ano', () => {
  useSettings.setState({ soundEnabled: false });
  feedback('lessonDone'); feedback('stageUp'); feedback('flightStart');
  expect(mockPlay).not.toHaveBeenCalled();
  expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
  expect(Haptics.impactAsync).toHaveBeenCalledWith('soft');
});

test('vypnutá Haptika: žádný úder, zvuk ano', () => {
  useSettings.setState({ hapticsEnabled: false });
  feedback('lessonDone'); feedback('setupDone');
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  expect(Haptics.impactAsync).not.toHaveBeenCalled();
  expect(mockPlay).toHaveBeenCalledTimes(2);
});

test('rychlý sled stejného zvuku: omezovač pustí jen první v okně, haptika vždy', () => {
  feedback('xpTick'); now += 5; feedback('xpTick'); now += 5; feedback('guideShow');
  expect(mockPlay).toHaveBeenCalledTimes(1);
  now += SFX_MIN_GAP_MS; feedback('xpTick');
  expect(mockPlay).toHaveBeenCalledTimes(2);
  feedback('seriesPlate'); feedback('seriesPlate');
  expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
});

test('každé nové id je v UI skutečně volané', () => {
  const root = join(__dirname, '..', '..');
  const where: Record<string, string> = {
    flightStart: 'components/transition/PlateFlight.tsx',
    lessonDone: 'components/lesson/LessonCompleteScene.tsx',
    stageUp: 'app/stage-up.tsx',
    guideShow: 'components/mascot/GuideBubble.tsx',
    setupDone: 'app/setup.tsx',
    timerStart: 'app/fitness-test.tsx',
    timerStop: 'app/fitness-test.tsx',
  };
  for (const [id, file] of Object.entries(where)) {
    expect({ id, wired: readFileSync(join(root, file), 'utf8').includes(`feedback('${id}')`) }).toEqual({ id, wired: true });
  }
  // Konec lekce: success haptika už nejde mimo mapu (žádné dvojí přehrání s zvukem success).
  expect(readFileSync(join(root, where.lessonDone!), 'utf8')).not.toMatch(/playSfx\('success'\)/);
  expect(playSfx).toBeDefined();
  // Vstupní test: ± stepperu = wheelStep, uložení testu = setupDone (stejná odezva jako dokončení nastavení).
  expect(readFileSync(join(root, 'components/ui/NumberStepper.tsx'), 'utf8')).toContain("feedback('wheelStep')");
  expect(readFileSync(join(root, 'app/fitness-test.tsx'), 'utf8')).toContain("feedback('setupDone')");
});
