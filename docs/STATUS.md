# Stav práce: fáze 1, plán A (core loop)

Aktualizováno: 2026-09-29 ~22:50. Větev `faze1/core-loop`, zrcadlená na `main`.

- **Plán:** `docs/superpowers/plans/2026-09-29-opice-faze1-core-loop.md`
- **Spec:** `docs/superpowers/specs/2026-09-29-opice-faze1-design.md`

**Proces:** každý task má implementera a BOSS review (0–100). UI tasky navíc dostávají DESIGN review ze screenshotů (Expo web + Playwright, světlý i tmavý režim). Dál se pokračuje až při 100/100 od obou.

## Hotovo (100/100)

| Task | Obsah |
|---|---|
| 1 | Scaffolding: Expo SDK 57, strict TS, ESLint hranice vrstev, jest (TZ Europe/Prague) |
| 2–6 | Typy, obsah (cviky, lekce, milníky, ligy, sezóna), čistá logika (dates, streak, xp, map, mascot, completion, onboarding) |
| 7 | Store (zustand + AsyncStorage, migrace), mock services, hooky |
| 8 | Theme light/dark + sezónní override, UI primitiva, root layout |
| 9 | Maskot `SvgMascot` stage 1 (idle, happy) |
| 10 | Onboarding: 5 obrazovek včetně zrození opice |

## Rozpracováno: Task 11, mapa lekcí

Commit `998f727` (kód je hotový, 166 testů prošlo). Review round 1: **BOSS 90/100, DESIGN 87/100.** K opravě:

1. **[Important] NodePopover (a11y):** `accessibilityViewIsModal` bez `onAccessibilityEscape` uvězní VoiceOver.
   - Přidat `onClose` prop a `onAccessibilityEscape={onClose}`.
   - Přidat vlastní ghost tlačítko „Zavřít“ (hlavně pro zamčený uzel).
2. **[Important] Plate (kontrast):** číslo kg a popisek „KG“ nesplňují kontrast 4.5:1 (světlý plate10 ≈ 3:1, „KG“ má ~5 pt).
   - Barvu čísla volit podle světlosti kotouče: tmavá na světlých, skoro bílá na tmavých.
   - Kombinace přidat do `theme/__tests__/contrast.test.ts`.
   - Popisek „KG“ odstranit, nebo zvětšit na ≥9 pt se zaručeným kontrastem.
3. **[Minor] Popover u dokončeného uzlu** překrývá aktuální uzel a opici. Ukotvit ho na stranu od dalšího uzlu, nebo ho omezit tak, aby nepřekrýval sousední uzly.
4. **(drobnost) `useTierName`:** pro neznámý tier vrátit název prvního tieru místo `null`.

Pak re-review (BOSS i DESIGN): flow `tools/flows/t11-design.mjs`.

## Zbývá v plánu A

- **Task 12: lekce.** Cviky, SVG siluety, `HoldTimer`, `lessonFlow`.
  - Vytvoří route `/lesson/[id]`.
  - Po jejím vytvoření odstranit `as Href` v mapě.
- **Task 13: oslava dokončení.** Kotouč přiletí na činku, `+XP`, opice.
  - Navigace zpět na `/(tabs)?unlocked=<id>`, ne na `/?unlocked=`, protože redirect query ztratí.
- **Task 14:** závěrečné ověření, self-critique, screenshoty.
- **Finální review celé větve.**

Pak následuje plán B: maskot stage 2–3 a kosmetika, Liga, Progres, Sezóna + recap, Šatník, notifikace, Dev menu, README.

## Rozhodnutí (rulings) k přečtení

Úplný seznam rozhodnutí R1–R22 je v lokálním ledgeru `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/progress.md`. Ledger je gitignored, takže není v repu.

Hlavní rozhodnutí:
- `@/data/copy` je jediná výjimka z hranice UI → data.
- Světlé barvy upravené na kontrast 4.5:1:
  - light `muted` `#5E5E63`
  - light `accentText` `#AE3A0B`
  - light `danger` `#B42328`
  - dark `danger` `#EB5E62`
- Tabulární číslice jen u stylů display, title a label.
- Scéna zrození je vždy tmavá.
- Vlastní milník používá jednotku „Počet“.
- Na obrazovce zrození je blokované hardwarové tlačítko zpět na Androidu.

## Spuštění

```
npm install
npx expo start      # Expo Go
npm test            # 166 testů
npm run typecheck
npm run lint
```
