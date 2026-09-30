import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

// Zvuky jsou doplněk jako haptika: chyba přehrávání se tiše spolkne.
// Tichý režim (iOS přepínač ticho/zvonění) se respektuje: expo-audio má výchozí playsInSilentMode true,
// proto se jednou přepne na false. Cizí hudbu nepřerušujeme (mixWithOthers).
let modeSet = false;
const ensureMode = () => {
  if (modeSet) return;
  modeSet = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
};

/** Cvaknutí zámku osy při dopadu kotouče (spec §7.3). Vlastní syntetizovaný WAV (90 ms). */
export function useClickSound() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro asset
  const player = useAudioPlayer(require('../assets/sounds/click.wav'));
  useEffect(ensureMode, []);
  return () => {
    try {
      void player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      // zvuk je jen doplněk
    }
  };
}
