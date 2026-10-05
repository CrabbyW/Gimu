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

// Skia v jestu nemá nativní modul ani CanvasKit. `lib/commonjs/mock` exportuje jen továrnu `Mock(CanvasKit)`
// (potřebuje jestEnv s wasm), proto vlastní atrapa: Canvas a primitivy = View s předanými props (testy čtou props).
jest.mock('@shopify/react-native-skia', () => {
  /* eslint-disable @typescript-eslint/no-require-imports -- atrapa uvnitř jest.mock */
  const React = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const stub = (name: string) => {
    const C = (props: Record<string, unknown>) => React.createElement(View, { ...props, skiaType: name }, props.children as never);
    C.displayName = `Skia${name}`;
    return C;
  };
  return {
    Canvas: stub('Canvas'), Group: stub('Group'), Circle: stub('Circle'), Points: stub('Points'), BlurMask: stub('BlurMask'),
    Path: stub('Path'), Paint: stub('Paint'), Line: stub('Line'),
    vec: (x: number, y: number) => ({ x, y }),
    useFont: () => null,
  };
});

// lucide-react-native se v jestu nepřeloží (ESM .mjs): každá ikona je prázdná komponenta. Soubory s vlastním mockem mají přednost.
jest.mock('lucide-react-native', () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? (t as Record<string | symbol, unknown>)[k] : () => null) }));
