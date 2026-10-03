import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import { useSettings } from '@/store/settings';

// Zvuky jsou doplněk jako haptika: chyba přehrávání se tiše spolkne (motion spec §6.2).
// Tichý režim (iOS přepínač ticho/zvonění) = ticho přes playsInSilentMode false; appka přepínač nečte.
// Cizí hudbu nepřerušujeme (mixWithOthers); jen scéna oslavy ji na chvíli ztlumí (`setDucking`).
// Přepínač `soundEnabled` je nezávislý na haptice.

/* Zvuky: Kenney (kenney.nl), licence CC0, z knihovny SFX skillu brag. Převod ffmpeg do WAV 44.1 kHz mono 16 bit
 * (hraje iOS i Android), postup v docs/LOG.md. */
/* eslint-disable @typescript-eslint/no-require-imports -- Metro asset */
const SOURCES = {
  /** Nacvaknutí kotouče: impactPlate_heavy_003 (kov) + impactSoft_medium_001 (tělo úderu), lowpass 9 kHz. */
  plateSnap: require('../assets/sounds/plate-snap.wav'),
  /** Výběr v nabídce: ui/click2, −4.4 dB, lowpass 8 kHz. */
  select: require('../assets/sounds/select.wav'),
  /** Odemčení uzlu: interface/bong_001, −3 dB. */
  unlock: require('../assets/sounds/unlock.wav'),
  /** Suchý dřevěný klik (odpočet, XP ticky, kotouč série): impactWood_light_002, 60 ms, lowpass 7 kHz. */
  tick: require('../assets/sounds/tick.wav'),
  /** Kovový cink oslavy: impactBell_heavy_003, ořez s fade-out, lowpass 7 kHz, −6 dB. */
  ring: require('../assets/sounds/ring.wav'),
  /** Tlumený gong (rekord, stage-up): impactBell_heavy_000 o kvintu níž, 1.8 s, lowpass 3.5 kHz. */
  gong: require('../assets/sounds/gong.wav'),
} satisfies Record<string, AudioSource>;
/* eslint-enable @typescript-eslint/no-require-imports */

export type SfxName = keyof typeof SOURCES;

/** Hlasitost 30 %, dlouhé dozvuky 25 % (§6.2.3). */
const VOLUME: Record<SfxName, number> = { plateSnap: 0.3, select: 0.3, unlock: 0.3, tick: 0.3, ring: 0.25, gong: 0.25 };

const players = new Map<SfxName, AudioPlayer>();
let ready = false;

/** Vytvoří všechny přehrávače jednou (start appky), aby první přehrání nemělo latenci dekódování. Idempotentní. */
export function preloadSounds(): void {
  if (ready || Platform.OS === 'web') return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
  for (const name of Object.keys(SOURCES) as SfxName[]) {
    try {
      const p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name];
      players.set(name, p);
    } catch {
      // zvuk je jen doplněk
    }
  }
}

/** Přehraje zvuk od začátku (respektuje přepínač). Web (jen dev náhled) je bez zvuku: autoplay politika
 *  by vyhodila nezachycený promise rejection. */
export function playSfx(name: SfxName): void {
  if (Platform.OS === 'web' || !useSettings.getState().soundEnabled) return;
  preloadSounds();
  const p = players.get(name);
  if (!p) return;
  try {
    void p.seekTo(0).catch(() => undefined);
    p.play();
  } catch {
    // zvuk je jen doplněk
  }
}

/** Ztlumení cizí hudby během oslavy; vrací se v cleanupu scény i v `skipToEnd`. */
export function setDucking(on: boolean): void {
  if (Platform.OS === 'web') return;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: on ? 'duckOthers' : 'mixWithOthers' }).catch(() => undefined);
}

/** Zachované API: funkce, která zvuk přehraje (sdílí singleton přehrávač). */
export const useSfx = (name: SfxName) => () => playSfx(name);

/** Nacvaknutí kotouče při dopadu (spec §7.3). */
export const useClickSound = () => useSfx('plateSnap');
