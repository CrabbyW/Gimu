# UX pass (design spec)

Datum: 2026-10-09. Zadání uživatele: „do it all“ k 10 bodům UX/UI kritiky (lekce, pocit po lekci, animované siluety, méně pojmů, důvod se vrátit, verzálky, čitelnost stavů, opička, hustota na 320, kalibrace haptiky). Otevřené volby rozhodl boss **[předpoklad]**.

## Podprojekty (každý design → motion → QA → rating)
**U1 Lekce + pauza (body 1, 9):** obrazovka cviku: velké Done (min 64 pt výška, celá šířka), „Next up“ řádek s dalším cvikem, jeden tip techniky vždy viditelný (první věta popisu), pauza mezi cviky s odpočtem **[předpoklad: 30 s, Skip rest, +15 s]**, méně prvků na 320 pt. Logika: fáze `rest` v `logic/lessonFlow.ts`.
**U2 Pocit po lekci + progrese (bod 2):** po oslavě jedno ťuknutí „Easy / Right / Hard“ (přeskočitelné). Logika `logic/progression.ts`: osobní korekce dávek ±10 % za hodnocení, meze 0.7–1.3, násobí se s násobkem vstupního testu; „Right“ nemění nic; uložit v profilu (`progression`). Služba `rateLesson(attemptId, feel)` idempotentní pro stejný pokus.
**U3 Animované siluety (bod 3):** tečková smyčka pohybu pro cviky (2–3 klíčové pózy, plynulý přechod), Reduce Motion = statická póza.
**U4 Méně pojmů + důvod se vrátit (body 4, 5, 6):** progresivní odhalení: Liga po 3 dokončených lekcích, Sezóna po 5, Šatník po 2 **[předpoklad]**; zamčené taby ukážou krátké vysvětlení („Unlocks after 3 lessons“), ne skryté (stabilní tab bar). Na mapě řádek „Next: <lekce> · N min“ a varování „Streak ends tonight“ když dnes nic. Verzálky jen pro krátké štítky (≤ 3 slova), věty sentence case.
**U5 Čitelnost stavů + opička (body 7, 8):** done/current/locked rozlišitelné za 0.5 s (tvar + výplň, ne jen jas teček); opička větší v prázdných stavech, přerušené sérii a první lekci.
**U6 Kalibrace haptiky (bod 10):** nejde bez telefonu → iPhone checklist + všechny hodnoty v jednom místě (`lib/feedbackMap.ts`, `lib/sound.ts`) připravené k ladění.

## Testy
Každá logika má jest testy (fáze rest, progrese, odhalení, řádek Next). Každý podprojekt e2e flow a kontrolu kolizí na w320–w430 dark/light. Stávající e2e a perf zelené.
