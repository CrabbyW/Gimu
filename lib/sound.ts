import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import { useSettings } from '@/store/settings';

// Zvuky jsou doplněk jako haptika: chyba přehrávání se tiše spolkne (motion spec §6.2).
// Tichý režim (iOS přepínač ticho/zvonění) = ticho přes playsInSilentMode false; appka přepínač nečte.
// Cizí hudbu nepřerušujeme (mixWithOthers); jen scéna oslavy ji na chvíli ztlumí (`setDucking`).
// Přepínač `soundEnabled` je nezávislý na haptice.

/* Zvuková paleta (elite fáze 2): syntetizovaná skriptem `scripts/gen-sounds.mjs` (C dur pentatonika, suché tečkové
 * tóny), WAV 44.1 kHz mono 16-bit. Gramatika: pokrok stoupá, chyba klesá. Přegenerování: `node scripts/gen-sounds.mjs`. */
const SOURCES = {
  /** Jemný krok (odpočet, XP, kotouč série): A5, 25 ms. */
  tick: require('../assets/sounds/tick.wav'),
  /** Výběr volby: E5, 35 ms. */
  select: require('../assets/sounds/select.wav'),
  /** Nacvaknutí kotouče / konec výdrže: E4 + B4, 90 ms. */
  snap: require('../assets/sounds/snap.wav'),
  /** Odemčení uzlu: C5–E5–G5. */
  unlock: require('../assets/sounds/unlock.wav'),
  /** Konec lekce, podpis oslavy: C5–G5–C6. */
  success: require('../assets/sounds/success.wav'),
  /** Chyba formuláře, zamčeno: G4–D4. */
  error: require('../assets/sounds/error.wav'),
  /** Let kotouče: šumový sweep. */
  swoosh: require('../assets/sounds/swoosh.wav'),
  /** Reakce opičky na ťuknutí: C6, 40 ms. */
  pop: require('../assets/sounds/pop.wav'),
  /** Stage-up: C5–E5–G5–C6. */
  levelUp: require('../assets/sounds/level-up.wav'),
} satisfies Record<string, AudioSource>;

export type SfxName = keyof typeof SOURCES;
/** Registr pro testy pokrytí (každý zvuk z mapy odezvy existuje). */
export const SFX_NAMES = Object.keys(SOURCES) as SfxName[];

/** Hlasitost: krátké tiky 35 %, ostatní 60 % (spec fáze 2 §2). */
const VOLUME: Record<SfxName, number> = {
  tick: 0.35, select: 0.35, pop: 0.35, snap: 0.6, unlock: 0.6, success: 0.6, error: 0.6, swoosh: 0.5, levelUp: 0.6,
};

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
export const useClickSound = () => useSfx('snap');
