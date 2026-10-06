# QA report

## Tab bar, opička v klidu, barvy, demo (43cb2db, 25f442e, c3ca0d8, 3dc9561)

**Verdikt: SCHVÁLENO**

### Build
- `tsc --noEmit` ✅ · `jest` 67 sad / 673 testů ✅ · `eslint .` bez chyb ✅
- `$TEMP/expogo.log`: 0 řádků ERROR (žádné „Cannot copy value of type PanGesture“).

### Tab bar ✅
- Web (390×844, dark i light): jedno kliknutí přepne každý z 5 tabů (league/progress/season/profile/zpět), správná URL.
- Gesture.Race(Pan, Tap) v jednom GestureDetectoru; Pan se aktivuje až po `activeOffsetX`, takže tap zůstává tapem. Tah: podložka jede za prstem, `navigate` až v `onEnd` (jedno přepnutí); `onFinalize` bez úspěchu → `settle`.
- Guard: `tabPress` s `canPreventDefault`; při `defaultPrevented` se nenaviguje a podložka dosedne zpět na `active`.
- Haptika: jen `tick` při přechodu slotu během tahu; tap ani puštění druhou haptiku nespouštějí.
- Worklety zachytávají jen shared values, čísla a RN funkce předané přes `scheduleOnRN`; žádné objekty Gesture.
- Čtečka: role `tablist`/`tab`, label, `accessibilityState.selected`, aktivace přes `onAccessibilityTap` a akci `activate`.
- **Opraveno (QA):** na webu chyběl `aria-selected` (RN Web už `accessibilityState` nemapuje, všechny taby měly prázdnou hodnotu). Přidáno `aria-selected={focused}` do `components/ui/FloatingTabBar.tsx`. Ověřeno: `false,true,false,false,false`.

### Opička v klidu ✅
- `useMascotIdle`: jeden `setTimeout` na pauzu, `setState` jen jednou za akci (žádná smyčka); `active = enabled && focused && !reduced && !sleeping`, cleanup přes `clearTimeout`.
- Během reakce nic nespustí: `canIdle` vyžaduje `now - reactionAt >= busyMs` a pauza se počítá přes `busyLeft`; nová reakce časovač přeplánuje.
- Reduce Motion: idle vrací `null`, dýchání a hop jsou vypnuté, zůstává jen mrkání (větev `reduced` v SvgMascot).
- Výkon: animace běží na UI vlákně (Reanimated), JS jen plánuje. Na zařízení jsem fps neměřil (K ruční kontrole).

### Barvy ✅
- Snímky mapa/liga/progres/sezóna/profil/lekce v dark i light: nic nečitelného, akcent mimo seasonGold výjimky nevidím.
- Test kontrastu prošel (ovládací prvky ≥ 3:1). Hrana Toggle/TextField `borderStrong` je v kódu; vizuálně v nastavení jen namátkou.

### Demo ✅
- Demo profil: [SKIP] je vidět i při běžícím časovači (`alwaysSkip={demo}`). Normální profil má podmínku beze změny (skip skrytý při running/countdown/done).

### Nálezy
| # | Závažnost | Nález | Vlastník |
|---|---|---|---|
| 1 | nízká | Web: chybělo `aria-selected` u tabů, **opraveno** | boss (hotovo) |

### K ruční kontrole (iPhone)
- Jedno ťuknutí na tab, tah s haptickými tiky a přepnutí po puštění, VoiceOver „vybráno“ + dvojklik aktivuje.
- Plynulost idle animací opičky, v pódiu i na mapě při scrollu; Reduce Motion = jen mrkání.
- Toggle vypnutý a TextField v nastavení v obou režimech.
