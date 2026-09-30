# Task 14 — závěrečné ověření core loopu (qa-agent, 2026-09-30)

## Step 1: příkazy (po opravě b006c93)

```
$ npm test
Test Suites: 25 passed, 25 total
Tests:       198 passed, 198 total

$ npm run typecheck
> tsc --noEmit
(bez výstupu, exit 0)

$ npm run lint
> expo lint
(bez výstupu, exit 0)

$ npx expo-doctor
20/21 checks passed. 1 checks failed.
✖ Check that required peer dependencies are installed
Missing peer dependency: expo-asset
Required by: expo-audio
Advice: Install missing required peer dependency with "npx expo install expo-asset"
Your app may crash outside of Expo Go without this dependency.
```

Typované routy: `tsc --noEmit` s odsunutým `.expo/types` i `expo-env.d.ts` (stav čistého klonu) → exit 0, bez chyb.

## Step 2: hranice

```
$ grep -rE "@/(store|data|services/mock)" app components
```
20 zásahů, všechny `import { copy } from '@/data/copy'` — povoleno Rulingem R1. Žádný `@/store`, jiný `@/data/*` ani `@/services/mock`.

## Step 3: screenshoty

Web 390×844 @2x, light + dark: `.superpowers/sdd/2026-09-29-opice-faze1-core-loop/shots/qa-step2-r2/` (flow `tools/flows/qa-step2.mjs`): onboarding (cesta, sen, milníky, chyba váhy, zrození), mapa nová / po odemčení / po reloadu / po bossovi, lekce reps, lekce hold, oslava lekce i bosse, zamčená lekce přes URL, neznámá lekce. Quit z mapy: `shots/qa-quit/` (`flows/qa-quit.mjs`). Žádný pageerror ani console.error.

## Step 4: self-critique

| Bod | Stav |
|---|---|
| více než jeden akcent | OK — jen #FF6B35 (+ accentText pro text, R12) |
| dvojité oddělovače | OK na snímcích |
| plné ikony | OK — Lucide outline; plné tvary jen glyfy cest a kotouče (ilustrace) |
| `#000` / `#FFF` | OK — grep nic; `"white"` jen jako SVG maska v `PathLine.tsx` |
| centrovaný hero se dvěma tlačítky | OK — žádný |
| pružina na UI ovládání | OK — `withSpring` jen zrození, oslava, XP pop, odemčení, skok opice (§6.8 výjimka) |
| dotyk < 44 | OK — uzly, CTA, zavřít; beze změny od design review |
| kontrast | OK — contrast test v jestu zelený (R12, R14, R24) |
| hardcoded hodnoty mimo theme | NÁLEZ — `fontSize/lineHeight` v `app/onboarding/dream.tsx:46`, `components/ui/TextField.tsx:33`, `components/ui/TopBar.tsx:11,67`; `MASCOT_COLORS` v `components/mascot/palette.ts` → design-agent |

## Nálezy

Viz `docs/QA.md` (seznam otevřených problémů s vlastníkem).
