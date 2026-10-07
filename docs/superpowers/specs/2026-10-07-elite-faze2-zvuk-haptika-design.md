# Elite fáze 2 — zvuk a haptika jako jeden systém (design spec)

Datum: 2026-10-07. Zdroj: prompt `docs/prompts/2026-10-06-elite-ui-workflow.md` A4.
Uživatel nastavil cíl „udělej to vše s testy“, takže otevřené volby rozhodl boss. Jsou označené **[předpoklad]**.

## 1. Cíl
Každá interakce má odezvu ze stejné rodiny. Zvuky jsou suché, krátké, tečkové „bleepy“ v duchu Nothing OS a sedí na haptiku. Výška tónu nese význam: pokrok stoupá, chyba klesá. Nic nehraje bez důvodu a všechno respektuje přepínače Haptika a Zvuky i tichý režim iOS.

## 2. Zvuková paleta [předpoklad: syntetizované, ne nahrávky]
- Zvuky generuje deterministický skript `scripts/gen-sounds.mjs` (Node, bez závislostí; WAV 44.1 kHz mono 16-bit, krátké sinusové a trojúhelníkové tóny s obálkou). Výstup jde do `assets/sounds/`. Žádné stock nahrávky, zdroj je v repu a jde přegenerovat.
- **Gramatika:**

  | Zvuk | Tón | Délka | Použití |
  |---|---|---|---|
  | `tick` | A5 | 25 ms | jemný krok (odpočet, XP, výběr) |
  | `select` | E5 | 35 ms | výběr volby |
  | `snap` | dvojtón E4+B4 se suchým útlumem | 90 ms | nacvaknutí kotouče, dokončení výdrže |
  | `unlock` | stoupající arpeggio C5–E5–G5 | 180 ms | odemčení uzlu |
  | `success` | C5–G5–C6 | 260 ms | konec lekce, podpis oslavy |
  | `error` | klesající G4–D4 | 120 ms | chyba formuláře, zamčeno |
  | `swoosh` | šumový sweep | 160 ms | let kotouče |
  | `pop` | krátký sinusový ping C6 | 40 ms | reakce opičky (ťuknutí) |
  | `levelUp` | C5–E5–G5–C6 s dozvukem | 420 ms | stage-up |

- Hlasitost: výchozí 0.6, krátké tiky 0.35. Tóny v jedné stupnici (C dur pentatonika) ladí dohromady i při rychlém sledu.

## 3. Mapování (`lib/feedback.ts`)
- Každý `FeedbackId` má dvojici `[haptika, zvuk]` podle gramatiky.
- Nová id: `flightStart` (swoosh + soft), `lessonDone` (success + success haptika), `stageUp` (levelUp + success), `guideShow` (tick, bez haptiky), `setupDone` (select + light).
- Navigace (tab, scroll) nemá zvuk, jen haptiku `selection`. Zvuk je pro dění ve hře.
- Tabulka mapování je čistá a testovaná (`lib/feedbackMap.ts` exportuje MAP).

## 4. Pravidla [předpoklad]
- **Rate-limit:** stejný zvuk nejvýš 1× za 40 ms. Tik při rychlém tahu po tab baru tak „nezabzučí“. Logika je v `logic/sfxGate.ts`, testovaná.
- **Přepínače:** Haptika a Zvuky nezávislé (už existuje); tichý režim iOS = ticho (expo-audio `playsInSilentMode: false`).
- **Reduce Motion:** neovlivňuje zvuk ani haptiku.

## 5. Testy
- **Generátor:** deterministický (stejný SHA-1 obsahu při dvou bězích); každá WAV má správnou hlavičku, délku v toleranci ±5 ms a žádné klipování (peak ≤ 0.99).
- **Mapování:** každý `FeedbackId` má záznam; každý zvuk v MAP existuje v `assets/sounds` a v registru `lib/sound.ts`; navigační id nemají zvuk; žádný nepoužitý soubor v `assets/sounds`.
- **sfxGate:** limit 40 ms, různé zvuky se neblokují.
- **Integrace (jest):** `feedback('lessonDone')` zavolá haptiku i zvuk; s vypnutým přepínačem nic.
- **iPhone checklist:** hlasitost, ladění dohromady, tichý režim, haptika sedí na zvuk.
