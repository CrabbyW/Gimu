# Launch video Opice — storyboard

25 s · 30 fps (750 snímků) · master 1080×1920 (9:16), cutdown 1920×1080 (16:9).
Samostatný Remotion projekt. Appka na něm nezávisí. Obraz tvoří **skutečné screenshoty a nahrávky z appky**
(Expo web + Playwright, demo profil z dev menu), uložené do `public/capture/`.

Vizuální jazyk = appka (R42): Kurogane černá `#0B0B0C`, text `#EDEDEF`, muted `#8A8A90`, Inter Light display,
JetBrains Mono telemetrie s tabulárními číslicemi. Ember `#FF6B35` se objeví **jen jednou** — v momentě
nacvaknutí kotouče (oslava dokončení) a doznívá na CTA. Žádné gradienty, žádné glass, žádný bounce na textu.
Easing vstupů `cubic-bezier(0.22,1,0.36,1)`, odchodů `(0.4,0,0.2,1)`; spring jen na fyzické prvky (telefon, kotouč).

| # | Čas | Snímky | Obraz | Text / telemetrie | Pohyb |
|---|---|---|---|---|---|
| 1 | 0–3 s | 0–90 | Opice (screenshot zrození) na černé, vlevo dole | „Tvoje opice roste s každou lekcí.“ (display) + `STAGE 01 · BABY` | Text odkrývá maska zleva 500 ms, opice fade 400 ms |
| 2 | 3–8 s | 90–240 | Telefon s mapou lekcí, pomalý posun nahoru | Telemetrie naskakuje vpravo: `STREAK: 12 D` → `XP: 460` → `LIGA: KÁMEN` | Telefon spring dovnitř, čísla count-up 400 ms, po jednom |
| 3 | 8–13 s | 240–390 | Nahrávka lekce: karta cviku, výdrž | `CVIK 03/04` + MeasureLine se plní | Crossfade 200 ms, linka 1:1 s časem |
| 4 | 13–18 s | 390–540 | Nahrávka oslavy: kotouč nacvakne na osu, ember | `+44 XP` · pak stage-up `STAGE 02 · TEENAGER` | Jediný ember moment, kotouč spring, záblesk max 6 snímků |
| 5 | 18–23 s | 540–690 | Split: liga (tvůj řádek) a sezóna (DotGrid) | `POZICE: 4` · `WINTER ARC · 60 DNÍ` | Dva telefony, odsazený start 6 snímků |
| 6 | 23–25 s | 690–750 | Logo „Opice“ + CTA | „Trénuj. Opice roste.“ + `IOS · ANDROID` | Fade in 400 ms, ember tečka u CTA |

**16:9 cutdown:** stejné scény a časy. Telefon vpravo, text vlevo ve sloupci 40 % šířky.

**Otevřené pro uživatele:** claim a CTA (navrženo „Trénuj. Opice roste.“), hudba nebo zvuk (zatím bez audia, jen cvak kotouče z `assets/sounds/click.wav`).
