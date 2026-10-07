# Elite fáze 1 — vlajková linka: first run → první lekce → oslava (design spec)

Datum: 2026-10-07. Zdroj: `docs/prompts/2026-10-06-elite-ui-workflow.md` (A2, A3, A5).

Rozhodnutí: uživatel nastavil cíl „pokračuj beze mě“ a odpověděl „pokračuj“, takže otevřené volby rozhodl boss podle doporučení. Každá je označená **[předpoklad]** a uživatel ji může změnit.

## 1. Cíl
Nový uživatel se od otevření appky do dokončení první lekce dostane s wow efektem a bez tření:
- **k první lekci do ~30 s** (dnes 6 kroků onboardingu);
- **jeden plynulý příběh:** opička se narodí z teček, ukáže kotouč a ten kotouč „odjede“ do lekce a vrátí se v oslavě.

## 2. Rozsah a rozhodnutí
1. **Krátký onboarding [předpoklad: varianta 1].** Kroky jsou *Cesta* → *Narození opičky* → rovnou mapa s jasným CTA první lekce. Vize, milníky, váha a připomínka se přesouvají za první oslavu.
   - Profil vznikne hned s výchozími hodnotami: vize = první z cesty, milníky = 2 předvolby cesty, váha = žádný cíl, připomínka vypnutá.
   - Logika výchozích hodnot je v `logic/onboarding.ts` a testovaná. Existující `services.user.create` se nemění, jen dostane výchozí data.
2. **„Doplň cíle“ po první oslavě.** Na obrazovce oslavy první lekce se pod CTA objeví sekundární pilulka „Set your goals“. Na mapě je pak dlaždice „Finish setup · 3 steps“, dokud cíle nejsou doplněné.
   - Vede do existujících editorů cílů (`app/goals/*`) a na připomínku.
   - Příznak `setupDone` je v profilu: volitelné pole, starší profily = true.
3. **Kotouč jako pojivo (sdílený prvek) [předpoklad: vlastní overlay, ne nativní shared transition].**
   - **Start lekce:** aktuální `DotPlate` se z polohy na mapě (změřené `measureInWindow`) přesune a zmenší do horní řady lekce (DotRow pokroku), zatímco se lekce vysune. Řeší to celoobrazovkový overlay v kořenovém layoutu (`components/transition/PlateFlight.tsx` + store `lib/plateFlight.ts`).
   - **Oslava:** tečky slétající do kotouče startují z místa, kde byl kotouč v lekci (jinak střed).
   - **Návrat na mapu:** kotouč „dosedne“ na uzel (stávající unlock sekvence).
   - Reduce Motion: bez letu, jen prolnutí.
4. **Opička průvodce [předpoklad: krátké mono bubliny, max. 1 na obrazovku, jen při prvním průchodu].**
   - Komponenta `GuideBubble`: mono text v dlaždici s šipkou z teček k opičce. Zmizí na tap nebo po akci.
   - Obsah: na mapě „Tap the plate to start“, v první lekci „Hold the timer or tap Done“, v oslavě „That's your first plate“.
   - Stav „viděno“ je v settings store, logika výběru v `logic/guide.ts` (testovaná).
5. **První lekce přívětivá:** existující první lekce cesty (3 min) zůstává. Skip ukazuje už od prvního cviku, pokud to `canSkip` dovolí (beze změny logiky).

## 3. Mimo rozsah
Zvuk (fáze 2), opička 2.0 / osobnost (fáze 3), audit ostatních obrazovek (fáze 4).

## 4. Testování
- **Jest:**
  - `logic/onboarding.ts`: výchozí data podle cesty;
  - `logic/guide.ts`: která bublina, kdy a jen jednou;
  - `setupDone` migrace starších profilů;
  - store `plateFlight`.
- **E2E (`e2e/flows/first-run.spec.ts`):** čistý start → cesta → narození → mapa → start lekce → skip → oslava → „Set your goals“ → editor cílů. Měří čas od prvního otevření po start lekce (≤ 30 s s automatizovanými kliky).
- **E2E `map-ripple.spec.ts`** (dluh z fáze 0): tah po pozadí mapy změní kreslené tečky (porovnání snímku canvasu před a během tahu).
- **Vizuální baseline:** nové a změněné obrazovky (onboarding 2 kroky, bubliny, dlaždice „Finish setup“).
- **iPhone checklist:** let kotouče plynulý, haptika, bubliny nepřekrývají ovládání, Reduce Motion.

## 5. Chyby a okraje
- Uživatel zavře appku po narození: profil existuje, mapa ukáže bublinu a dlaždici „Finish setup“.
- Starý profil (před touto fází): `setupDone` = true, bubliny se nezobrazí.
- `measureInWindow` selže nebo vrátí 0: let se přeskočí, zůstane normální přechod.
- Reset app: bubliny i `setupDone` se vynulují (nový first run).
