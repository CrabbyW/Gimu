// TZ=Europe/Prague se vynucuje v jest.global-setup.ts (běží v rodičovském
// procesu před spuštěním workerů — jediné místo, kde nastavení process.env.TZ
// skutečně ovlivní časovou zónu testů). Tenhle soubor běží už uvnitř workera,
// takže tu TZ jen ověřujeme jako backstop, nenastavujeme ji znovu.

// Guard: 30. 9. 00:01 místního času (Europe/Prague, CEST = UTC+2) odpovídá 29. 9. 22:01 UTC.
// Pokud tenhle předpoklad neplatí, testy počítající s místním dnem (dates/streak/completion) by
// tiše prošly i na hostiteli v jiné časové zóně — proto tvrdý throw, ne jen skip.
if (new Date(2026, 8, 30, 0, 1).getUTCDate() !== 29) {
  throw new Error(
    'TZ guard selhal: proces neběží v Europe/Prague. Zkontroluj jest.global-setup.ts.',
  );
}

// expo-audio nativní modul v jestu neexistuje: singletony přehrávačů z `lib/sound.ts` dostanou atrapu.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ volume: 1, play: () => undefined, seekTo: () => Promise.resolve() }),
  setAudioModeAsync: () => Promise.resolve(),
  useAudioPlayer: () => ({ volume: 1, play: () => undefined, seekTo: () => Promise.resolve() }),
}));
