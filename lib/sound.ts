import { setAudioModeAsync, useAudioPlayer, type AudioSource } from 'expo-audio';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Zvuky jsou doplněk jako haptika: chyba přehrávání se tiše spolkne.
// Tichý režim (iOS přepínač ticho/zvonění) se respektuje: expo-audio má výchozí playsInSilentMode true,
// proto se jednou přepne na false. Cizí hudbu nepřerušujeme (mixWithOthers).
let modeSet = false;
const ensureMode = () => {
  if (modeSet) return;
  modeSet = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
};

/* Zvuky UX2: Kenney (kenney.nl), licence CC0, převzaté z knihovny SFX skillu brag.
 * Převod ffmpeg do WAV 44.1 kHz mono 16 bit (hraje iOS i Android), detaily v docs/LOG.md. */
/* eslint-disable @typescript-eslint/no-require-imports -- Metro asset */
const SOURCES = {
  /** Nacvaknutí kotouče: impactPlate_heavy_003 (kov) + impactSoft_medium_001 (tělo úderu), lowpass 9 kHz. */
  plateSnap: require('../assets/sounds/plate-snap.wav'),
  /** Výběr v nabídce: ui/click2, −4.4 dB, lowpass 8 kHz. */
  select: require('../assets/sounds/select.wav'),
  /** Odemčení uzlu: interface/bong_001, −3 dB. */
  unlock: require('../assets/sounds/unlock.wav'),
} satisfies Record<string, AudioSource>;
/* eslint-enable @typescript-eslint/no-require-imports */

export type SfxName = keyof typeof SOURCES;

/** Vrací funkci, která zvuk přehraje od začátku. */
export function useSfx(name: SfxName) {
  const player = useAudioPlayer(SOURCES[name]);
  useEffect(ensureMode, []);
  return () => {
    // Web (jen dev náhled): expo-audio volá `HTMLMediaElement.play()` bez `.catch`, takže autoplay politika
    // nebo přerušení seekem vyhodí nezachycený promise rejection (pageerror). Na webu je zvuk proto vypnutý.
    if (Platform.OS === 'web') return;
    try {
      void player.seekTo(0).catch(() => undefined);
      player.play();
    } catch {
      // zvuk je jen doplněk
    }
  };
}

/** Nacvaknutí kotouče při dopadu (spec §7.3). */
export const useClickSound = () => useSfx('plateSnap');
