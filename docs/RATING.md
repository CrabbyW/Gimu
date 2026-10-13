# Rating: splash 03 „Tečkový nápis“ (8309364..6aa0374), 2026-10-13

## Brány
1. QA SCHVÁLENO pro d713736 (0981dde). Commity potom (0981dde, 6aa0374) mění jen docs/LOG.md a docs/QA.md. ✅
2. Rating-agent spustil všechny kontroly: tsc 0, eslint 0, jest 103 sad / 988 testů OK, `npm run e2e` 172/172, `npm run e2e:perf` 5/5. ✅
3. LOG má záznamy motion-agenta (d713736), qa-agenta (0981dde) a bosse (6aa0374). QA.md má sekci kola 8309364..d713736. Sekci Splash v README aktualizoval motion-agent v d713736. ✅
4. iPhone checklist (5 bodů) je v QA reportu. `$TEMP/expogo.log` je zapsán 13. 10. 09:51, tedy po HEAD kódu. Obsahuje iOS Bundled i Android Bundled a 0 řádků ERROR. Tím je splněná podmínka z verdiktu QA. ✅

## Skóre: 85/85 „čeká na iPhone“ (z 100)

| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | e2e prošly včetně `flows/intro.spec.ts`, v QA reportu není ❌ |
| Vizuální kvalita | 20/20 | 172/172 bez neschválených diffů na 4 šířkách × dark/light včetně 320 pt. Tečka nad I bere barvu z theme `dark.live`, v diffu není žádný hex |
| Motion a haptika | 15/15 | jeden nástup splashe, mrknutí s haptikou, Reduce Motion ukáže statický konec, v diffu není spring, perf ≥ 55 fps |
| Zařízení | 0/15 (čeká) | uživatel nepotvrdil iPhone checklist kola splash 03. Patří **boss** |
| Přístupnost | 10/10 | test kontrastu a a11y sada e2e jsou zelené |
| Výkon | 10/10 | e2e:perf: Skia plátna ≤ 12, TTI mapy ≤ 3 s. V diffu není setState |
| Architektura a kód | 10/10 | v diffu není `any`, TODO, eslint-disable ani hex barva. Glyfy jsou v logic/dotGlyphs, časování v lib/motion, tokeny v theme/ |

## Co chybí do 100/100
- Uživatel musí potvrdit iPhone checklist v docs/QA.md (sekce splash 03). Body: sken OPICE bez bliknutí, haptika mrknutí, odjezd a crossfade s „Balance 101“ bez skoku, tap skip a Reduce Motion, safe area. Patří **boss**.

## Doporučení (mimo skóre)
- Jest stále hlásí worker, který neskončil (qa-agent).
