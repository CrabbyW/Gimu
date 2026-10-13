# Rating: splash A Probuzení + 30 póz opice v pohybu + zapojení póz (0a78bad..e951c5f), 2026-10-13

## Brány
1. QA SCHVÁLENO pro 80ba03b (651b7d3). Commity potom (651b7d3, e951c5f) mění jen README.md, docs/LOG.md a docs/QA.md. ✅
2. tsc 0, eslint 0, jest 103/988 OK, `npm run e2e` 172/172, `npm run e2e:perf` 5/5. Vše spustil rating-agent. ✅
3. LOG má záznamy design, motion, qa a boss. QA.md má sekci kola 1 (0a78bad..80ba03b). README je aktualizované v e951c5f. ✅
4. iPhone checklist (5 bodů) je v QA reportu. `$TEMP/expogo.log` zapsán 13. 10. 08:46 (po HEAD kódu), obsahuje iOS Bundled i Android Bundled a 0 řádků ERROR. ✅

## Skóre: 85/85 „čeká na iPhone“ (z 100)

| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | e2e toky prošly, v QA reportu není ❌ |
| Vizuální kvalita | 20/20 | 172/172 bez neschválených diffů na 4 šířkách × dark/light včetně 320 pt, červená jen přes theme `ink.live` |
| Motion a haptika | 15/15 | Reduce Motion je v usePoseMotion i ve splashi, v diffu není spring, perf ≥ 55 fps (mapa, lekce, oslava) |
| Zařízení | 0/15 (čeká) | uživatel zatím nepotvrdil iPhone checklist kola 1, patří **boss** (předat checklist uživateli) |
| Přístupnost | 10/10 | test kontrastu prošel, a11y sada e2e je zelená, opička v nastavení je dekorace skrytá pro VoiceOver |
| Výkon | 10/10 | Skia plátna ≤ 12 a TTI mapy ≤ 3 s (e2e:perf) |
| Architektura a kód | 10/10 | v diffu 0a78bad..HEAD není `any`, TODO, eslint-disable ani hex barva. Mapování póz je v logic/, smyčky v lib/ |

## Co chybí do 100/100
- Uživatel musí potvrdit iPhone checklist kola 1 v docs/QA.md (splash, lekce 8 + stage-up s haptikou, čitelnost poháru a medaile na 48/32 pt, Reduce Motion, nastavení a VoiceOver). Patří **boss**.

## Doporučení (mimo skóre)
- Vlastní řádek ligy na 1.–3. místě a stage-up po lekci 8 nemají vizuální baseline. Doplnit e2e scénář (boss / design-agent).
- Jest hlásí worker, který neskončil (únik časovače) (qa-agent).
