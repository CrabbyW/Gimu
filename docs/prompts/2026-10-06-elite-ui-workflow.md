# Prompt: Elite level — UI a workflow

> Vstup pro `/superpowers:brainstorming`. Navazuje na hotový redesign Nothing Dot (fáze 1–3, rating 100/100, `docs/HANDOFF.md`).
> Cíl: posunout appku z „hotové a pěkné“ na úroveň, kterou by šlo postavit vedle Nothing OS, Things 3 nebo Duolinga. Totéž platí pro tým a proces, který ji staví.

## Kontext
- Expo / React Native gamifikovaná kalistenika s opičkou. Jazyk Nothing Dot: monochrom, tečky přes Skia, dlaždice, Doto, Inter a JetBrains Mono. Opička je jediná barva.
- Spec `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`, barevný systém `docs/design/color-system.md`, SPEC `docs/SPEC.md`.
- Tým v `CLAUDE.md`: boss → design → motion → QA → rating 100/100.
- Uživatel testuje v Expo Go na iPhonu přes Cloudflare tunel. Agenti ověřují na webu (Playwright, Chrome).

## Co víme z dosavadní práce (slabá místa)
**UI:**
- Opravdový iPhone vidí jen uživatel. Chyby, které web neukáže, jsme našli až od něj:
  - pád workletu s PanGesture,
  - křížek pod hodinami,
  - dvojí ťuknutí na tab baru,
  - proporce mapy.
- Některé věci zůstaly jen „k ruční kontrole“: haptika, 60 fps, VoiceOver, Dynamic Type a Reduce Motion na zařízení.
- Řada rozhodnutí vznikla ad hoc a celek ještě nikdo neprošel s odstupem, například Doto 24 pt na 320 pt, závoj 0.86 a hustota tečkového pozadí.
- Chybí nebo jsou slabé:
  - zvukový design,
  - první dojem (onboarding a „first run“ wow),
  - prázdné a chybové stavy jako zážitek,
  - jednotná choreografie přechodů mezi obrazovkami.

**Workflow:**
- Design-agent a motion-agent nemají shell. Píšou naslepo a boss pak opravuje typy, testy a lint.
- Agenti si šlápli do procesů. `taskkill /IM node.exe` shodil Expo server uživatele.
- QA přepsala historii `docs/QA.md`.
- Metro v CI módu nesledoval změny a dlouho jsme to nepoznali.
- Rating je binární a hodně dokumentační (65 a 50 bodů jen za chybějící LOG nebo QA záznam). Neměří kvalitu zážitku.
- Chybí vizuální regresní testy. Screenshoty se dělají ručně a jen občas.
- Chybí výkonnostní rozpočet (fps, čas do první interakce, velikost bundlu) a jeho měření.

## Cíle (definice „elite“)
1. **Zážitek:** každá obrazovka má jeden jasný subjekt, jeden orchestrovaný nástup a hmatovou a zvukovou odezvu. Nic neskáče, nic se neopakuje mechanicky. Opička působí jako postava, ne jako ikona.
2. **Řemeslo:** pixel-perfect na 320, 375, 390 a 430 pt. Dynamic Type do 1.4. Kontrast AA. VoiceOver projde každý tok. 60 fps na iPhonu 12 a středním Androidu.
3. **Důslednost:** jeden zdroj pravdy pro tokeny, pohyb, haptiku a zvuk. Žádné ad-hoc výjimky bez zapsaného rozhodnutí.
4. **Proces:** každá změna je ověřená na zařízení nebo v jeho věrné náhradě, má vizuální regresi a měřitelné metriky. Chyby z telefonu přestanou chodit až od uživatele.

## Oblasti k brainstormingu

### A. UI a zážitek
1. **Audit s odstupem:** projít všechny obrazovky proti skillu `aesthetic` (Never list) a referencím `images/`. Seznam „co by udělal Nothing / Things / Linear jinak“ seřadit podle dopadu.
2. **First run:** onboarding jako zážitek. Opička se „narodí“ z teček a provede uživatele. Cíl první lekce do 60 s. Zvážit skip onboardingu do demo módu.
3. **Choreografie přechodů:** jednotný systém přechodů mezi taby a modaly (shared element kotouč mapa → lekce → oslava, tečky jako pojivo). Stejná easing rodina všude.
4. **Zvukový design:** sada zvuků v duchu Nothing (krátké, suché, tečkové „tiky“), sladěná s haptikou (`lib/feedback`). Přepínač Zvuky. Zvážit tichý režim iOS.
5. **Opička 2.0:** osobnost a příběh. Reaguje na čas dne, sérii a pokrok. Má „repliky“ (krátké mono bubliny). Má kosmetiku viditelnou v mapě. Vlastní reakce na rekord.
6. **Typografie a rytmus:** vertikální rytmus 8pt na všech obrazovkách. Pravidla pro Doto při dlouhých titulcích (zvážit zkracování obsahu místo zmenšování). Tabulární čísla všude.
7. **Stavy:** prázdné, načítací, chybové a offline stavy jako navržené momenty s opičkou. Skeletony z teček.
8. **Přístupnost na úrovni Apple:** VoiceOver pořadí, popisky, aktivace a rotory. Dynamic Type layouty. Reduce Motion alternativy, které jsou pořád hezké. Barvoslepost.
9. **Výkon jako design:** rozpočet pláten a teček, 60 fps, čas startu, lazy obrazovky. Měřit, ne odhadovat.

### B. Workflow a tým
1. **Zařízení ve smyčce:** iOS simulátor / Android emulátor nebo cloud zařízení (EAS, Maestro, Detox, Appium). Automatické screenshoty na 4 velikostech, dark i light, Dynamic Type 1.4. Na Windows zvážit Android emulátor a Maestro flows a pro iOS EAS build + simulátor v cloudu.
2. **Vizuální regrese:** Playwright (web) a Maestro (nativ) baseline snímky ve složce `docs/visual/`, diff v každém QA kole. Rating čte diffy.
3. **E2E toky:** onboarding → první lekce → oslava → stage-up → liga, jako Maestro nebo Playwright skripty v repu (ne ve scratchpadu), spouštěné QA.
4. **Shell pro všechny agenty:** dát design-agentovi a motion-agentovi Bash (tsc, jest, eslint, screenshot) se zakázanými příkazy. Zakázat `taskkill /IM`, sahání na port 8082 a na tunel.
5. **Pravidla procesů a souborů:**
   - `docs/QA.md` a `docs/LOG.md` jen append, hlídané hookem nebo testem;
   - porty: 8081 pro agenty, 8082 pro uživatele;
   - Metro nikdy s CI=1;
   - hooky v `.claude/settings.json`.
6. **Nová rubrika ratingu:** méně papírování, víc zážitku. Kategorie zařízení (snímky z nativu), výkon (naměřené fps a start), přístupnost (VoiceOver tok), vizuální regrese (diffy schválené). Dokumentace jako brána (ano/ne), ne 10 bodů.
7. **Design review s referencemi:** před buildem 2–3 směry vedle sebe (Artifact), uživatel vybere, teprve pak kód. Po buildu porovnání s referencí.
8. **Telemetrie zážitku:** dev overlay s fps, počtem pláten a renderů a haptickými událostmi, aby QA a uživatel viděli čísla.
9. **Release kadence:** EAS preview buildy (TestFlight / interní Android) místo tunelu. Stabilní odkaz, OTA updaty přes EAS Update.

## Omezení
- Jazyk Nothing Dot, monochrom a opička jako jediná barva zůstávají. Pravidla `CLAUDE.md`: tokeny jen z `theme/`, logika v `logic/`, data přes `services/`.
- Windows stroj bez Macu: iOS ověřování přes Expo Go, EAS nebo cloud. Navrhni realistickou cestu.
- Žádné placené služby bez souhlasu uživatele (EAS free tier OK, cloud zařízení zeptat se).
- Workflow změny v `CLAUDE.md` a `.claude/` jen se souhlasem uživatele.

## Otevřené otázky pro brainstorming
1. Co je pro „elite“ priorita č. 1: zážitek (A), nebo proces (B)? Nebo vlajková linka obou: first run → první lekce → oslava?
2. Zvukový design: ano, a v jakém charakteru?
3. Opička 2.0: kolik osobnosti (repliky, příběh), aby nezačala otravovat?
4. Zařízení ve smyčce: Android emulátor + Maestro lokálně, EAS + cloud iOS, nebo obojí?
5. Rubrika ratingu: přepsat (souhlas uživatele), nebo jen doplnit?
6. Release: přejít z tunelu na EAS preview build a TestFlight?

## Výstup brainstormingu
Spec v `docs/superpowers/specs/`, pak plán po fázích (každá fáze: design → motion → QA → rating). Fáze 0 = workflow (zařízení ve smyčce, vizuální regrese, shell agentům, pravidla), protože všechno další z ní těží.
