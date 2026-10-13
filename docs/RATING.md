# Rating: opice v2 + mapa Kurogane + pohyb + splash + oko siluety + demo build + barvy/kontrast/typografie (kód 81c2aa6, docs 742533d), 2026-10-13, kolo 2

**Skóre: 85/85, čeká na iPhone.** Kategorie Zařízení (15) se doplní, až uživatel potvrdí iPhone checklist z QA kola 2.

## Brány (všechny splněné)
1. QA SCHVÁLENO pro 81c2aa6 a v doplňku i pro 78080eb. Commity 1a9e2d2, 78080eb a 742533d mění jen README.md, docs/LOG.md a docs/QA.md.
2. Rating to dnes spustil sám: tsc OK, eslint OK, jest 103 sad / 955 testů, `npm run e2e` 172/172.
3. docs/LOG.md má záznamy bosse, design-agenta, motion-agenta i qa-agenta. docs/QA.md má sekci kola 2 i doplněk. README popisuje demo build (`EXPO_PUBLIC_DEMO=1`), splash a `gen:splash`.
4. iPhone checklist (5 bodů) je v QA reportu. `$TEMP/expogo.log` je zapsán 2026-10-13 06:29:49, tedy po 81c2aa6. Obsahuje iOS i Android Bundled a 0 řádků `ERROR`.

## Kategorie
| Kategorie | Body | Poznámka |
|---|---|---|
| Funkčnost | 20/20 | e2e/flows projdou (součást 172/172); spec kroku je v QA kole 2 bez ❌ (otevřené jsou jen ⚠️) |
| Vizuální kvalita | 20/20 | Baseline 4 šířky × dark/light přegenerované v 81c2aa6 a schválené v QA kole 2 (QA.md a LOG); ořez na pódiu na w320 je opravený a jistí ho e2e test `liga: jména na pódiu nejsou oříznutá` (mutačně ověřeno v QA) |
| Motion a haptika | 15/15 | Prolnutí póz a splash jedou přes withTiming s Reduce Motion variantou (useReducedMotion, statická póza). Pružina u opice (`SvgMascot.tsx:167`) není na klikatelném prvku (role image). Odemčení uzlu `PlateNode.tsx:238` je z dřívější fáze, hodnoceno stejně jako dřív. Haptika: mrknutí ve splashi, unlock, seriesPlate. e2e:perf 5/5, ≥ 55 fps (QA kolo 2 na stejném kódu) |
| Zařízení | – (čeká) | Uživatel zatím checklist kola nepotvrdil |
| Přístupnost | 10/10 | Splash Pressable má roli button, opice role image s popiskem, pódium má a11y label bez U+200B; contrast.test.ts je zelený (live dark ≥ 4.5:1); a11y a large-text e2e jsou zelené |
| Výkon | 10/10 | perf: plátna ≤ 12, TTI mapy ≤ 3000 ms; smyčky póz jsou ve sdílených hodnotách (lib/poseMotion.ts), ne setState |
| Architektura a kód | 10/10 | Pózy jako data v logic/mascotPoses.ts, headDotIndex v logic/silhouette.ts, hexy jen v theme/palettes.ts, časování z lib/motion; žádné `any`; žádná výjimka z `local/no-worklet-object-capture` |

Nesplněná kritéria: žádná. Chybí jen potvrzení iPhone checklistu od uživatele. Patří bossovi: předat uživateli 5 bodů z QA kola 2.

## Doporučení (mimo skóre)
- Otevřené ⚠️ z QA: ukazatel bubliny průvodce míří na kotouč místo karty Start (design); limit délky jmen v lize pro 3+ řádky (design/boss); chybí e2e test opičky u bosse na w320 (qa); únik časovače v Jestu (qa).
- Rubrika by měla výslovně říct, že nativní log musí být zapsán po schváleném HEAD.
- Několik `eslint-disable-next-line react-hooks/exhaustive-deps` nemá odůvodnění za `--` (např. `components/map/PlateNode.tsx:240`). Rubrika to nepostihuje.
