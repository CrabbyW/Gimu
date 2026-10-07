# Elite fáze 2 — zvuk a haptika Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jednotná zvuková a haptická gramatika: syntetizovaná paleta 9 zvuků, kompletní mapování odezvy, rate-limit a testy.

**Architecture:** Deterministický generátor WAV (`scripts/gen-sounds.mjs`) vyrobí `assets/sounds/*.wav`. Mapování `FeedbackId → [haptika, zvuk]` žije v čistém modulu `lib/feedbackMap.ts`, rate-limit v `logic/sfxGate.ts`. `lib/sound.ts` registruje přehrávače a `lib/feedback.ts` je spojuje.

**Tech Stack:** Node (generátor), expo-audio, expo-haptics, Jest.

**Spec:** `docs/superpowers/specs/2026-10-07-elite-faze2-zvuk-haptika-design.md`

## Global Constraints
- Zvuky jen ze skriptu v repu (žádné stažené nahrávky). WAV 44.1 kHz mono 16-bit, peak ≤ 0.99.
- Navigace bez zvuku. Přepínače Haptika a Zvuky, tichý režim iOS = ticho.
- Hodnoty (hlasitosti, limit) v `lib/motion.ts` nebo vlastním tokenu `lib/sfx.ts`. Logika v `logic/`.

## Review Focus
- Rychlý tah po tab baru (5 slotů za 200 ms) nezabzučí: jen tiky ≥ 40 ms od sebe (test sfxGate).
- Vypnutý přepínač Zvuky = žádné `play`, a haptika přesto běží (test).
- Chybějící nebo poškozený soubor zvuku nesmí shodit appku (`playSfx` tichý fallback, test).
- Generátor je deterministický (test hash), takže diff v gitu má smysl.
- Každý nový `FeedbackId` napojený v UI (flightStart, lessonDone, stageUp, guideShow, setupDone) skutečně volá `feedback` (grep test nebo jednotkové testy komponent).

---

### Task 1 (boss): generátor + testy, sfxGate + testy, feedbackMap + testy
- `scripts/gen-sounds.mjs` (exporty `synth(spec): Float32Array`, `encodeWav(samples): Buffer`, `SOUNDS` specifikace podle spec §2; CLI zapíše `assets/sounds/*.wav`).
- `scripts/__tests__/gen-sounds.test.mjs` (node --test): determinismus, hlavička RIFF/WAVE, délky ±5 ms, peak ≤ 0.99, všech 9 zvuků.
- `logic/sfxGate.ts`: `createSfxGate(minGapMs)`, `allow(name, now)`, test.
- `lib/feedbackMap.ts`: MAP vytažená z `lib/feedback.ts` + nová id; test pokrytí (každé id, zvuky existují v `assets/sounds`, navigace bez zvuku, žádný nepoužitý soubor).
- Vygenerovat WAV, staré `gong/plate-snap/ring/select/tick/unlock.wav` nahradit nebo přemapovat (snap = plate-snap atd.), `lib/sound.ts` registr podle nových názvů.

### Task 2 (motion-agent): napojení
- `lib/feedback.ts` používá `feedbackMap` + `sfxGate`; `playSfx` s tichým fallbackem.
- Napojit nová id: let kotouče (`flightStart`), konec lekce (`lessonDone` v celebrationHaptics podpisu — zvuk success k success haptice), stage-up (`stageUp`), nástup bubliny průvodce (`guideShow`), Done ve /setup (`setupDone`), reakce opičky ťuknutí (`pop` k `mascotTap`).
- Testy integrace (jest) a ověření, že tichý režim iOS (`setAudioModeAsync({ playsInSilentMode: false })`) je nastavený.
- tsc, jest, eslint, e2e.

### Task 3 (qa) + rating
