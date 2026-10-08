import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FEEDBACK_MAP, NAVIGATION_IDS } from '@/lib/feedbackMap';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-audio', () => ({ createAudioPlayer: () => ({}), setAudioModeAsync: () => Promise.resolve() }));
// Registr zvuků z lib/sound (require WAV v jestu vrací modul, jména jsou to podstatné).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- čtení registru bez vedlejších efektů přehrávačů
const { SFX_NAMES } = require('@/lib/sound') as { SFX_NAMES: string[] };

const FILES = readdirSync(join(__dirname, '..', '..', 'assets', 'sounds')).filter((f) => f.endsWith('.wav'));
const fileOf = (name: string) => `${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.wav`;

test('každý zvuk z mapy odezvy je v registru a má soubor', () => {
  for (const [id, [, sfx]] of Object.entries(FEEDBACK_MAP)) {
    if (!sfx) continue;
    expect({ id, inRegistry: SFX_NAMES.includes(sfx) }).toEqual({ id, inRegistry: true });
    expect(FILES).toContain(fileOf(sfx));
  }
});

test('žádný nepoužitý zvukový soubor ani zvuk v registru', () => {
  const used = new Set(Object.values(FEEDBACK_MAP).map(([, s]) => s).filter(Boolean) as string[]);
  // `select` hraje i výběr v onboardingu přes useSfx; ostatní musí jít přes mapu odezvy.
  used.add('select');
  expect([...SFX_NAMES].sort()).toEqual([...used].sort());
  expect(FILES.sort()).toEqual([...used].map(fileOf).sort());
});

test('navigace a ovládání nemají zvuk', () => {
  for (const id of NAVIGATION_IDS) expect(FEEDBACK_MAP[id][1]).toBeNull();
});

test('gramatika: pokrok stoupá, chyba klesá', () => {
  expect(FEEDBACK_MAP.lessonDone[1]).toBe('success');
  expect(FEEDBACK_MAP.stageUp[1]).toBe('levelUp');
  expect(FEEDBACK_MAP.formError[1]).toBe('error');
  expect(FEEDBACK_MAP.locked[1]).toBe('error');
  expect(FEEDBACK_MAP.flightStart[1]).toBe('swoosh');
});

test('stopky vstupního testu: start s úderem a tikem, stop jen haptika', () => {
  expect(FEEDBACK_MAP.timerStart).toEqual(['rigid', 'tick']);
  expect(FEEDBACK_MAP.timerStop).toEqual(['medium', null]);
});

test('intro: jemný puls bez zvuku', () => {
  expect(FEEDBACK_MAP.introPulse).toEqual(['soft', null]);
});
