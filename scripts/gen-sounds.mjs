// Generátor zvukové palety (elite fáze 2, spec docs/superpowers/specs/2026-10-07-elite-faze2-zvuk-haptika-design.md §2).
// Deterministická syntéza krátkých „tečkových“ tónů v C dur pentatonice → assets/sounds/*.wav (44.1 kHz, mono, 16-bit).
// Spuštění: `node scripts/gen-sounds.mjs`. Žádné stažené nahrávky; zdroj zvuku je tenhle soubor.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_RATE = 44100;
const PEAK = 0.9;

const NOTE = { D4: 293.66, E4: 329.63, G4: 392.0, B4: 493.88, C5: 523.25, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5 };

/**
 * Zvuk = sled tónů. Tón: frekvence (nebo přechod from → to), začátek a délka v ms, tvar vlny, útlum.
 * `noise` = šumový sweep (filtrovaný bílý šum s deterministickým generátorem).
 */
export const SOUNDS = {
  tick: { ms: 25, file: 'tick.wav', tones: [{ f: NOTE.A5, at: 0, ms: 25, wave: 'sine', decay: 9 }] },
  select: { ms: 35, file: 'select.wav', tones: [{ f: NOTE.E5, at: 0, ms: 35, wave: 'triangle', decay: 7 }] },
  snap: {
    ms: 90, file: 'snap.wav',
    tones: [{ f: NOTE.E4, at: 0, ms: 90, wave: 'triangle', decay: 10 }, { f: NOTE.B4, at: 0, ms: 70, wave: 'sine', decay: 12 }],
  },
  unlock: {
    ms: 180, file: 'unlock.wav',
    tones: [
      { f: NOTE.C5, at: 0, ms: 60, wave: 'sine', decay: 6 },
      { f: NOTE.E5, at: 60, ms: 60, wave: 'sine', decay: 6 },
      { f: NOTE.G5, at: 120, ms: 60, wave: 'sine', decay: 5 },
    ],
  },
  success: {
    ms: 260, file: 'success.wav',
    tones: [
      { f: NOTE.C5, at: 0, ms: 80, wave: 'triangle', decay: 5 },
      { f: NOTE.G5, at: 80, ms: 80, wave: 'triangle', decay: 5 },
      { f: NOTE.C6, at: 160, ms: 100, wave: 'sine', decay: 4 },
    ],
  },
  error: {
    ms: 120, file: 'error.wav',
    tones: [{ f: NOTE.G4, at: 0, ms: 60, wave: 'triangle', decay: 6 }, { f: NOTE.D4, at: 60, ms: 60, wave: 'triangle', decay: 6 }],
  },
  swoosh: { ms: 160, file: 'swoosh.wav', tones: [{ noise: true, from: 600, to: 3200, at: 0, ms: 160, decay: 3 }] },
  pop: { ms: 40, file: 'pop.wav', tones: [{ f: NOTE.C6, at: 0, ms: 40, wave: 'sine', decay: 10 }] },
  levelUp: {
    ms: 420, file: 'level-up.wav',
    tones: [
      { f: NOTE.C5, at: 0, ms: 90, wave: 'triangle', decay: 4 },
      { f: NOTE.E5, at: 90, ms: 90, wave: 'triangle', decay: 4 },
      { f: NOTE.G5, at: 180, ms: 90, wave: 'triangle', decay: 4 },
      { f: NOTE.C6, at: 270, ms: 150, wave: 'sine', decay: 2.5 },
    ],
  },
};

/** Deterministický generátor šumu (mulberry32), aby výstup byl stejný při každém běhu. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wave = (kind, phase) => (kind === 'triangle' ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sin(phase));

/** Syntéza zvuku do pole vzorků −1..1 (normalizováno na PEAK). */
export function synth(spec) {
  const n = Math.round((spec.ms / 1000) * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (const t of spec.tones) {
    const start = Math.round((t.at / 1000) * SAMPLE_RATE);
    const len = Math.min(n - start, Math.round((t.ms / 1000) * SAMPLE_RATE));
    const attack = Math.max(1, Math.round(0.003 * SAMPLE_RATE));
    const rand = rng(len);
    let phase = 0;
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      // Rychlý náběh (3 ms, bez lupnutí) a exponenciální útlum.
      const env = Math.min(1, i / attack) * Math.exp(-t.decay * x) * (1 - x);
      let v;
      if (t.noise) {
        // Šum přes jednopólový low-pass, jehož mezní frekvence klouže from → to.
        const fc = t.from + (t.to - t.from) * x;
        const k = 1 - Math.exp((-2 * Math.PI * fc) / SAMPLE_RATE);
        lp += k * (rand() * 2 - 1 - lp);
        v = lp;
      } else {
        phase += (2 * Math.PI * t.f) / SAMPLE_RATE;
        v = wave(t.wave, phase);
      }
      out[start + i] += v * env;
    }
  }
  const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  for (let i = 0; i < n; i++) out[i] = (out[i] / peak) * PEAK;
  return out;
}

/** PCM WAV (16-bit, mono). */
export function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii'); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8, 'ascii');
  h.write('fmt ', 12, 'ascii'); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SAMPLE_RATE, 24); h.writeUInt32LE(SAMPLE_RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii'); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

if ((process.argv[1] ?? '').endsWith('gen-sounds.mjs')) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
  for (const [name, spec] of Object.entries(SOUNDS)) {
    writeFileSync(join(dir, spec.file), encodeWav(synth(spec)));
    console.log(`${name} → assets/sounds/${spec.file}`);
  }
}
