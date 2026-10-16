# /brag plán: Opice

**Co to je:** mobilní appka, kalistenika jako hra: krátké lekce na mapě kotoučů a maskot opice, který roste s tebou.
**Pro koho:** začátečníci v kalistenice, kteří chtějí cvičit pravidelně a bavit se u toho.
**Čím se liší:** opice roste (stage 1 → 3) a každá lekce končí nacvaknutím kotouče na osu.
**Hook:** kotouč dopadne na osu s tvrdým úderem a vlastním zvukem appky (`plate-snap.wav`). Titulek „Kotouč na ose.“ je skutečný text z appky.
**Tón:** cinematic, zkrocený na osobnost appky (stejně jako motion z kroku 3, UX2). Tvrdé dopady, žádný zákmit.
**Vizuál:** dark paleta appky (`#0E0D0C`, akcent `#FF6B35`), Bebas Neue, Inter, JetBrains Mono. Opice a kotouče jsou převedené 1:1 z `components/mascot/SvgMascot.tsx` a `components/map/Plate.tsx`.
**Zvuk:** hudba ende.app „Happy Beats vol. 10“ (110 BPM) z balíčku brag a zvuky appky `plate-snap`, `unlock`, `select` (Kenney, CC0).

## Storyboard (20 s, 1920×1080, 30 fps)

| # | Čas | Scéna |
|---|---|---|
| 1 | 0.0–3.3 | Hook: kotouč 20 kg dopadne na osu, fajfka, „KOTOUČ NA OSE.“ |
| 2 | 3.3–7.1 | Reveal: „OPICE“, „Kalistenika jako hra.“, opice stage 1 poskočí |
| 3 | 7.1–12.0 | Mapa: řada kotoučů, třetí se nacvakne, +XP, čtvrtý se odemkne. „Krátké lekce. Každá končí kotoučem.“ |
| 4 | 12.0–16.4 | Růst: opice stage 1, 2, 3 jedna po druhé. „Opice roste s tebou.“ |
| 5 | 16.4–20.0 | Outro: stage 3 slaví s pažemi nahoře, „OPICE“ a „Tvůj první kotouč čeká.“ |

Žádná osobní data ani vymyšlená čísla. XP hodnota v mapě je ze skutečné lekce v `data/`.

## Verze 2 (2026-10-16): nové UI z větve faze1/core-loop
První verze vycházela ze staré větve `main`. Verze 2 je složená ze skutečných snímků nové appky
(Expo web export, demo profil, Playwright se zastaveným časem, 1170×2532 na snímek), na výšku 1080×1920.

| # | Čas | Scéna |
|---|---|---|
| 1 | 0.0–4.2 | Oslava dokončení „Plate on the bar.“ (kotouč se složí z teček), titulek „Calisthenics as a game.“ |
| 2 | 4.2–8.3 | Mapa „Balance 101“, „Short lessons on a map.“ |
| 3 | 8.3–12.4 | Lekce Crow s odpočtem, „Guided reps and holds.“ |
| 4 | 12.4–16.6 | Stage-up 1 → 2 „Your monkey is growing.“, „Your monkey grows.“ |
| 5 | 16.6–20.0 | Logo „Opice“, „Train. The monkey grows.“, ember tečka |

Zvuky: `snap`, `swoosh`, `level-up`, `tick` z `assets/sounds` nové appky, hudba ende.app vol. 10. Zdroj: `brag-output/work2/`.
