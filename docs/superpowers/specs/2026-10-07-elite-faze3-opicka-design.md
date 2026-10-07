# Elite fáze 3 — opička 2.0 (design spec)

Datum: 2026-10-07. Zdroj: prompt `docs/prompts/2026-10-06-elite-ui-workflow.md` A5. Cíl uživatele „udělej to vše s testy“, otevřené volby rozhodl boss **[předpoklad]**.

## 1. Cíl
Opička má osobnost: krátké mono repliky podle denní doby, série a pokroku a vlastní reakci na rekord série. Nesmí otravovat.

## 2. Repliky [předpoklad: anglicky, max 32 znaků, bez výčitek]
- Čistá logika `logic/mascotLines.ts`: `lineContext({ hour, streak, todayDone, best })` → `LineContext` a `pickLine(ctx, rng, lastId)` → `{ id, text }` nebo null.
- Kontexty podle priority: `todayDone` (hotovo dnes) > `streakHot` (série ≥ 7) > `streakOn` (série 1–6) > denní doba (`morning` 5–11, `day` 11–17, `evening` 17–22, `night` 22–5).
- Každý kontext má 3–4 věty v `data/copy.ts` (`copy.mascotLines`). Stejná věta se nikdy neopakuje dvakrát za sebou.
- Ztracená série nemá výčitku (pravidlo z mascotMood): kontext padne na denní dobu.

## 3. Kdy mluví [anti-otravování]
- **Ťuknutí na opičku na mapě:** k poskoku (`hop`) ukáže repliku v malé mono bublině nad opičkou, 2.4 s, pak zmizí. Nejvýš 1 bublina naráz; během zobrazení další ťuknutí jen vymění text, pokud uplynulo ≥ 1.2 s (cooldown reakcí).
- **Automaticky:** nikdy. Žádné samovolné mluvení (první-run průvodce už existuje a má přednost: když je vidět GuideBubble, replika se neukáže).
- Reduce Motion: bublina se jen prolne.

## 4. Rekord série
- `LessonResult.streakRecord: boolean` = nová série > nejdelší předchozí série a ≥ 2.
- Oslava lekce: při rekordu reakce `proud` + řádek „NEW RECORD · N DAYS“ (copy) a podpis haptiky beze změny (žádný další zvuk).

## 5. Testy
- `mascotLines`: hranice hodin (4/5/11/17/22), priorita kontextů, žádné opakování, každý kontext má ≥ 3 věty ≤ 32 znaků, determinismus s mulberry32.
- `completion`: `streakRecord` true/false (první den, překonání, vyrovnání, retry).
- Komponenta: ťuknutí ukáže bublinu s textem z copy, po 2.4 s zmizí; s GuideBubble se neukáže.
- e2e: ťuknutí na opičku na mapě ukáže bublinu (w390-dark).
