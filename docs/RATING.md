# Demo 2026-10-02, kolo 1 (rating-agent, HEAD a9a450c)

**Celkem podle rubriky: 65/100**
- **BOSS skóre: 46/100** (kategorie 1, 2, 3, 6 = 30/65 bodů, přepočteno na 100)
- **DESIGN skóre: 100/100** (kategorie 4, 5 = 35/35 bodů, platí s výhradou v sekci K ruční kontrole)

| # | Kategorie | Body | Skóre |
|---|---|---|---|
| 1 | Funkčnost | 0/25 | BOSS |
| 2 | Shoda se specifikací | 15/15 | BOSS |
| 3 | Architektura a kód | 15/15 | BOSS |
| 4 | Vizuální kvalita | 20/20 | DESIGN |
| 5 | Motion | 15/15 | DESIGN |
| 6 | Dokumentace | 0/10 | BOSS |

## Srážky
1. **Funkčnost, -25 (boss + qa):** poslední verdikt v `docs/QA.md` (Demo fáze 4, kolo 2) je **NESCHVÁLENO** (bug 1 dvojí tap → tab Sezóna, bug 10 ořez TVOJE XP v lize na 320). Boss je opravil v a9a450c (`lib/navGuard.ts`, `app/(tabs)/_layout.tsx`, `app/(tabs)/league.tsx`, `app/lesson/[id].tsx`, `app/stage-up.tsx`), ale qa-agent opravy znovu neověřil a SCHVÁLENO nedal. Testy 391/391, tsc a lint jsou čisté. To ale samo nestačí.
2. **Dokumentace, -10 (boss):** v `docs/LOG.md` chybí záznam bosse o opravách po kole 2. Jsou jen v `docs/QA.md` („Boss: opravy po kole 2“). Poslední záznam v LOG je od qa-agenta. README (sekce Demo) je aktuální.

## Co je potřeba pro ≥95
- qa-agent: kolo 3 s re-checkem bugů 1 a 10 (320×568 a 390×844, dvojtap 120 ms z oslavy i ze stage-upu; liga na 320 s 3cif. i **4cif. XP**, protože oprava zmenšila jen pozici, ne XP). Při SCHVÁLENO +25.
- boss: záznam v `docs/LOG.md` (navGuard 600 ms, kompaktní hlavička ligy, rozpis XP na 320 jako záměr). +10.
- Obě položky → 100/100 (BOSS 100, DESIGN 100).

## Ověřeno bez srážky
- Architektura: žádné `any`, TODO mají fázi (`services/contracts.ts`, `MockCosmeticsService.ts`, `LocalNotificationService.ts`, `app/season-recap.tsx`). V `app/` a `components/` nejsou hardcoded barvy ani přímý přístup k AsyncStorage/fetch (jen testy). Data jdou přes `services`.
- Design: jeden akcent (oranžová na +XP). Zelený trojúhelník POSTUP je sémantický. Typografie Stat/mono labely, tab bar bez ořezu na 320, prázdné, chybové a zamčené stavy existují (`ErrorState`, QA kolo 1).
- Motion: brag orchestrace podle LOG motion-agenta, pružiny jen na kotoučích, opici a rámu. Reduce motion podle QA kola 2 všude viditelné do 300 ms, návrat na tab sekvenci nepřehrává.

## K ruční kontrole (bez srážky)
- Liga na 320 pt po opravě (snímek `shots/demo-f4c/xs/dark-league.png` je ještě před opravou: „176“ na hraně, „XP“ mimo obraz). Hlavně 4ciferné XP.
- Dvojtap na fyzickém zařízení. Haptika a zvuk v rámu dopadu. VoiceOver/TalkBack (recap, modaly, řádky ligy). Reduce motion v systémovém nastavení iOS/Android.
- CTA oslavy na 320×568 po doběhnutí nástupu.

## Doporučení mimo rubriku
- Rubrika neumí rozlišit „opraveno, čeká na QA“ a „neopraveno“. Kategorie 1 tak padá celá i kvůli jednomu neověřenému re-checku.
- Rozpis XP v oslavě se na 320 zalamuje na 2 řádky (záměr design-agenta). Kosmeticky by šlo zkrátit oddělovače.
