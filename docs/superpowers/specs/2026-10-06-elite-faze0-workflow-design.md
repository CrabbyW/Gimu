# Elite level — fáze 0: workflow (design spec)

Datum: 2026-10-06. Zdroj: `docs/prompts/2026-10-06-elite-ui-workflow.md` a brainstorming s uživatelem.
Fáze 0 je první z podprojektů „elite“:
- 0 workflow,
- 1 vlajková linka (first run → lekce → oslava),
- 2 zvuk + haptika,
- 3 opička 2.0,
- 4 audit a řemeslo.

Každý podprojekt má vlastní spec, plán a realizaci.

## 1. Cíl
Proces najde chyby dřív než uživatel. Agenti ověřují vlastní práci, vizuální změny jsou vidět v diffu a nativní pády zachytí log. Rating měří zážitek, ne papírování.

## 2. Rozhodnutí uživatele
- Ověřování: web pro agenty, telefon (Expo Go přes tunel) testuje uživatel sám, jako dosud. Bez EAS a bez cloudových zařízení.
- Shell pro všechny agenty, ochranné hooky a úprava `CLAUDE.md`: ano.
- Rubrika ratingu se přepíše. Dokumentace je brána ano/ne.
- Žádné placené služby.

## 3. Ověřovací stack

### 3.1 Playwright v repu (`e2e/`)
- Závislost `@playwright/test` (dev). Prohlížeč: systémový Chrome (`channel: 'chrome'`) nebo `executablePath` z env `CHROME_PATH`. Bez stahování browserů.
- `e2e/playwright.config.ts`:
  - baseURL `http://localhost:8081`;
  - `webServer`: `npx expo start --web --port 8081` (bez CI=1), `reuseExistingServer: true`;
  - projekty pro šířky 320×568, 375×812, 390×844, 430×932 × colorScheme dark/light.
- Helper `e2e/helpers.ts`:
  - `loadDemo(page)` (/dev → „Load demo profile“);
  - `resetApp(page)`;
  - `waitForIdle(page)` (fonty načtené, CanvasKit připravený, animace doběhlé nebo Reduce Motion emulace).
- **E2E toky** (`e2e/flows/*.spec.ts`):
  - `onboarding.spec` (všech 6 kroků až na mapu);
  - `lesson.spec` (demo → start → Skip ×N → oslava → Continue → mapa);
  - `stage-up.spec` (dev stage);
  - `league.spec`;
  - `settings-reset.spec` (reset → onboarding);
  - `tabbar.spec` (1 klik přepne; tah po liště přepne po puštění).
- **Vizuální regrese** (`e2e/visual/*.spec.ts`):
  - `toHaveScreenshot` pro mapu, lekci, oslavu (Reduce Motion = konečný stav), ligu, progres, sezónu, profil, nastavení a onboarding/path;
  - pro všechny 4 šířky × 2 režimy;
  - animace se pro snímky zastaví emulací `prefers-reduced-motion: reduce`;
  - baseline je v `e2e/__screenshots__/` v gitu;
  - tolerance `maxDiffPixelRatio` 0.01;
  - nová baseline se ukládá jen vědomě (`npm run e2e:update`) se záznamem v LOG.
- **Měření** (`e2e/perf/*.spec.ts`):
  - počet `<canvas>` ≤ 12 na každé obrazovce;
  - fps během animace mapy / oslavy přes rAF sampler (5 s, medián ≥ 55 na webu);
  - čas do první interakce mapy (od navigace po interaktivní CTA) ≤ 3 s, s dev buildem jako referencí.
- Skripty v `package.json`: `e2e`, `e2e:visual`, `e2e:update`, `e2e:perf`.

### 3.2 Telefon (uživatel)
- Expo Go server na portu 8082 za Cloudflare tunelem běží trvale. Startuje bez `--clear`, aby první bundle nebyl pomalý. Po restartu boss předem stáhne bundle (prewarm).
- Každé kolo končí **iPhone checklistem**: nejvýš 5 bodů, jen to, co web neukáže (haptika, safe area, VoiceOver, plynulost). Uživatel odpoví „ok“ nebo pošle screenshot.

### 3.3 Nativní log
- QA po každém kole projde log Expo serveru (`$TEMP/expogo.log`) od posledního kola. Každý řádek `ERROR` je ❌.

### 3.4 Prevence nativních pádů
- ESLint pravidlo (lokální plugin `eslint-rules/no-worklet-object-capture`): uvnitř callbacku `useAnimatedStyle`, `useAnimatedProps`, `useDerivedValue`, `useAnimatedReaction` a gesture callbacků (`.onStart/.onUpdate/.onEnd/.onFinalize/.onTouches*`) zakáže přístup `X.Y.value`, kde `X` je proměnná z `use*` hooku vracející objekt (heuristika: hlásí member-chain hlubší než `a.b.value`). Výjimky přes komentář s důvodem.
- Test pravidla přes ESLint `RuleTester`.

## 4. Tým, oprávnění a pravidla

### 4.1 Agenti
- `.claude/agents/design-agent.md` a `motion-agent.md` dostanou nástroj Bash. Na konci každého úkolu spustí `npx tsc --noEmit`, `npx jest`, `npx eslint .` a relevantní `npm run e2e:visual -- --grep <obrazovka>`. Výsledek zapíšou do LOG.
- Paralelní agenti dostanou v zadání explicitní seznam souborů, na které nesmí sáhnout.

### 4.2 Hooky (`.claude/settings.json`, PreToolUse)
- **Bash:** blokovat příkazy obsahující
  - `taskkill` s `/IM node`,
  - `taskkill` na PID, který naslouchá na 8082 (hook zjistí přes `netstat`),
  - `cloudflared` s kill/stop,
  - `CI=1` spolu s `expo start`.

  Hláška vysvětlí pravidlo.
- **Write** na `docs/QA.md` a `docs/LOG.md` je blokovaný. Povolený je jen Edit.
- **Edit** na tyto soubory projde, jen když `old_string` je v souboru a `new_string` začíná `old_string` (jen připsání).
- Hook skript: `.claude/hooks/guard.mjs` (Node, bez závislostí) s testy v `.claude/hooks/__tests__/guard.test.mjs` (spouštěné jestem přes `testMatch` rozšíření, nebo samostatně přes `node --test`).

### 4.3 `CLAUDE.md` (doplnění)
- **Porty:** 8081 = web pro agenty (bez CI=1), 8082 = Expo Go uživatele. Na 8082 a tunel se nesahá.
- Commit s kódem po verdiktu QA vyžaduje nové QA. Bez něj rating neproběhne.
- Kolo končí iPhone checklistem (max. 5 bodů) a kontrolou nativního logu.
- **Worklet pravidlo:** zachytávat jen sdílené hodnoty a čísla, nikdy gesto, funkci ani objekt, který je obsahuje. Hlídá ho ESLint.
- `docs/QA.md` a `docs/LOG.md` se jen doplňují, nikdy nepřepisují. Hlídá to hook.
- Nová rubrika ratingu (odkaz na `.claude/agents/rating-agent.md`).

## 5. Rubrika ratingu (nová)

**Brány ano/ne** (když některá neplatí, rating neproběhne):
1. QA SCHVÁLENO platí pro HEAD (od verdiktu žádný commit s kódem).
2. tsc, jest, eslint a `npm run e2e` jsou zelené.
3. LOG má záznamy všech zúčastněných agentů, QA.md má sekci kola a README je aktuální.
4. iPhone checklist je odeslaný a nativní log je bez `ERROR`.

**Body (100):**

| Kategorie | Body | Měří |
|---|---|---|
| Funkčnost | 20 | E2E toky projdou |
| Vizuální kvalita | 20 | diffy schválené (4 šířky × 2 režimy), Never list skillu aesthetic |
| Motion a haptika | 15 | jeden nástup na obrazovku, Reduce Motion, žádný spring na klikatelném, fps ≥ 55 |
| Zařízení | 15 | iPhone checklist potvrzený uživatelem |
| Přístupnost | 10 | role a popisky, kontrast (test), fontScale 1.4 bez přetečení |
| Výkon | 10 | plátna ≤ 12, čas do první interakce, žádné setState ve smyčce animací |
| Architektura a kód | 10 | tokeny, vrstvy, žádné `any`, worklet pravidlo |

- Pokračuje se při 100/100.
- **Výjimka:** dokud uživatel iPhone checklist nepotvrdí, smí krok pokračovat s 85/85 a označením „čeká na iPhone“. Body se doplní po potvrzení.

## 6. Chyby a okraje
- Chrome není na stroji: config hlásí srozumitelnou chybu s návodem (`CHROME_PATH`).
- Port 8081 obsazený cizím procesem: `reuseExistingServer`. Testy ověří, že server je appka (titulek nebo `/status`).
- Flaky snímky (animace, fonty): Reduce Motion emulace, čekání na `document.fonts.ready` a CanvasKit, `animations: 'disabled'` v toHaveScreenshot.
- Hook omylem zablokuje legitimní příkaz: hláška obsahuje, jak pravidlo obejít s odůvodněním (jen uživatel smí upravit hook).

## 7. Testování fáze 0
- Testy hook skriptu (blokované i povolené příkazy, append-only Edit).
- RuleTester pro worklet pravidlo (případ PlateNode před opravou musí být hlášen).
- `npm run e2e` zelené na čistém repu. Baseline snímky vytvořené a commitnuté.
- Ověřovací kolo: QA a rating podle nové rubriky na současném HEAD.
