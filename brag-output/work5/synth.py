# Vlastní hudba k reklamám (bez licenčních omezení): numpy syntéza bicích, basy a padů.
# python3 synth.py a  → music-a.wav (110 BPM, 30 s, „Premium“)
# python3 synth.py b  → music-b.wav (140 BPM, 20 s, „Gen Z“ trap)
import sys, wave
import numpy as np

SR = 48000
rs = np.random.default_rng(1)

def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
    return e

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))

def kick(dur=.42, f0=150, f1=45, punch=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = band(rs.standard_normal(n), 1500, 6000) * env(n, .0005, .006, 1) * .4 * punch
    return np.sin(ph) * env(n, .002, dur * .55, 3.5) + click

def hat(dur=.05, bright=7000, amp=.35):
    n = int(dur * SR); return band(rs.standard_normal(n), bright, 16000) * env(n, .001, dur * .5, 4) * amp

def clap(dur=.22, amp=.6):
    n = int(dur * SR); x = band(rs.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for o in (0, .011, .022): e += env(n, .001, .012, 3) * (np.arange(n) >= int(o * SR)) * np.roll(np.ones(n), 0)
    e = np.maximum(e, env(n, .02, dur * .6, 3) * .7)
    return x * e * amp

def tone(freq, dur, amp=.3, harm=(1,), a=.01, d=None, glide=None):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.full(n, float(freq)) if glide is None else freq * (glide / freq) ** np.minimum(1, t / .12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(h_a * np.sin(ph * (i + 1)) for i, h_a in enumerate(harm))
    e = env(n, a, d if d else dur, 2.5) if d else np.minimum(1, t / a) * np.minimum(1, (dur - t) / .05)
    return x * e * amp

def pad(freqs, dur, amp=.08, a=.6, rel=.8):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for fr in freqs:
        for det in (-.004, 0, .004):
            ph = 2 * np.pi * fr * (1 + det) * t
            x += np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)
    e = np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (dur - t)) / rel)
    return x * e * amp / len(freqs)

def riser(dur, amp=.4):
    n = int(dur * SR); x = rs.standard_normal(n)
    # Postupné otevírání filtru: kousky se stále vyšší horní mezí.
    out = np.zeros(n); seg = int(.05 * SR)
    for i in range(0, n, seg):
        k = i / n; out[i:i + seg] = band(x[i:i + seg] if len(x[i:i+seg]) > 64 else np.zeros(seg)[:len(x[i:i+seg])], 300, 800 + 9000 * k ** 2)[:len(out[i:i+seg])]
    return out * (np.arange(n) / n) ** 2 * amp

def place(buf, x, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if i < len(buf): buf[i:j] += x[:j - i] * g

def hz(note):  # MIDI číslo → Hz
    return 440 * 2 ** ((note - 69) / 12)

def write(path, x):
    x = x / max(1e-9, np.max(np.abs(x))) * .89
    st = np.stack([x, x], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def song_a():
    bpm = 110; b = 60 / bpm; L = 30; buf = np.zeros(int(L * SR))
    prog = [(57, [57, 60, 64, 71]), (53, [53, 57, 60, 64]), (48, [48, 55, 60, 64]), (55, [55, 59, 62, 67])]  # Am F C G
    S2, S6, S7, S8 = 4 * b, 30 * b, 38 * b, 45 * b
    place(buf, pad([hz(n) for n in prog[0][1]], S2 + .4, .06, a=1.5, rel=.3), 0)
    place(buf, riser(S2 - .2, .25), .2)
    for beat in range(4, 60):
        t = beat * b
        if t >= L - .2: break
        if S8 <= t: continue
        half = S6 <= t < S7 - 4 * b
        build = S7 - 4 * b <= t < S7
        bar = int(beat // 4) % 4; root, chord = prog[bar]
        if beat % 4 == 0:
            place(buf, pad([hz(n) for n in chord], 4 * b + .1, .05 if not half else .07), t)
        if not half or beat % 2 == 0: place(buf, kick(), t, .95)
        if not half:
            place(buf, hat(), t + b / 2, .8)
            if beat % 2 == 1: place(buf, clap(), t, .5)
            place(buf, tone(hz(root - 24), b * .9, .32, (1, .3), a=.005, d=b * .8), t)
            place(buf, tone(hz(root - 12), b * .45, .08, (1, .5, .25), a=.005, d=.2), t + b / 2)
        if build:
            for k in range(4): place(buf, clap(.12, .35), t + k * b / 4, .4 + .15 * (beat - (S7 / b - 4)))
    place(buf, riser(1.1, .3), S7 - 1.1)
    # Konec: ticho → dopad loga, dlouhý akord.
    place(buf, riser(.9, .2)[::-1] * .6, S8)
    t_logo = 47 * b
    place(buf, kick(.9, 120, 38, 1.2), t_logo, 1.0)
    place(buf, pad([hz(n) for n in (57, 64, 71, 72, 76)], L - t_logo, .07, a=.05, rel=2.2), t_logo)
    write('music-a.wav', buf)

def song_b():
    bpm = 140; b = 60 / bpm; L = 20; buf = np.zeros(int(L * SR))
    notes = [42, 42, 45, 40]  # F#, F#, A, E (808)
    drop = 4 * b
    place(buf, riser(drop, .3), 0)
    for k in range(8): place(buf, hat(.04, 8000, .3), k * b / 2)
    stops = [(14 * b, 16 * b)]  # meme pauza před „glow up“
    for beat in range(4, int(L / b)):
        t = beat * b
        if any(a <= t < z for a, z in stops): continue
        if t >= 40 * b: break
        bar = int((beat - 4) // 4) % 4
        if beat % 4 in (0,) or (beat % 8 == 6): place(buf, tone(hz(notes[bar]), b * 1.8, .55, (1, .25, .1), a=.004, d=b * 1.6, glide=hz(notes[bar] - 5) if beat % 8 == 6 else None), t)
        if beat % 4 == 0 or beat % 8 == 5: place(buf, kick(.3, 170, 50), t, .9)
        if beat % 4 == 2: place(buf, clap(.25, .8), t, .8)
        roll = beat % 8 == 7
        for k in range(6 if roll else 2): place(buf, hat(.035, 8000, .28), t + k * b / (6 if roll else 2))
    # Konec: tvrdý stop + 808 dopad u loga.
    t_end = 40 * b
    place(buf, kick(.8, 140, 40, 1.3), t_end, 1)
    place(buf, tone(hz(42), 2.2, .6, (1, .25), a=.003, d=1.6), t_end)
    write('music-b.wav', buf)

{'a': song_a, 'b': song_b}[sys.argv[1]]()
