# Kde jsme skončili (aktualizováno 2026-10-07)

## Elite program HOTOVÝ (podprojekty 0–4) — všechny 85/85 „čeká na iPhone“ (2026-10-07)
- **2 zvuk + haptika** (QA 1 kolo): 9 syntetizovaných zvuků (`scripts/gen-sounds.mjs`), mapa odezvy `lib/feedbackMap.ts`, omezovač 40 ms, nová id napojená (let kotouče, konec lekce, stage-up, průvodce, setup).
- **3 opička 2.0** (QA 2 kola): repliky na ťuknutí (`logic/mascotLines.ts`, `LineBubble`), popisky pod bublinou se prolnou, rekord série v oslavě (`streakRecord`, `prideBeat`).
- **4 audit** (QA 2 kola): `StateView` (skeleton/chyba/prázdno), skryté dekorace, strop písma + tabulární číslice z theme, Reduce Motion prolnutí, a11y e2e, ochrana dat při chybě čtení úložiště (`store/db.ts`).
- Čeká: uživatelovo „ok“ k iPhone checklistům fází 0–4 (docs/QA.md) → 100/100.
- Otevřené (nízká priorita): `store/settings.ts` bez ochrany při chybě čtení; e2e test chybové obrazovky úložiště; test velkého písma jen 1.4× (přidat 2×); „BOSS“ 2 px nad CTA na w320-dark; perf v ratingu fáze 4 převzat z QA kola 1.

## Redesign „Nothing Dot“ — fáze 1 (systém + mapa + lekce + oslava)
- Spec: `docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md`
- Plán: `docs/superpowers/plans/2026-10-05-nothing-dot-faze1.md`
- Zadání a rozhodnutí uživatele: `docs/prompts/2026-10-05-redesign-nothing-dot.md`. Reference jsou v `images/`.
- Commity db940b8..257aafb: design, motion i QA jsou hotové (QA: SCHVÁLENO).

## Stav: fáze 1 HOTOVÁ — QA kolo 2 SCHVÁLENO, rating kolo 2 = 100/100 (docs/RATING.md, docs/QA.md)
K ruční kontrole na zařízení: scroll mapy vs. roztočení kotouče, haptika (tik 30°, success), plynulost Skia, Doto s diakritikou,
dotOff v light, dotykové plochy 44 pt, zamčený boss neotevírá popover (záměr?), kotouč částečně pod pruhem CTA po dosunutí mapy.
Otevřené pro fázi 2: web limit ~16 WebGL kontextů (mapa dnes 10 pláten).

## Fáze 2 HOTOVÁ — QA kolo 2 SCHVÁLENO, rating kolo 2 = 100/100 (plán `docs/superpowers/plans/2026-10-06-nothing-dot-faze2.md`)
K ruční kontrole: stage-up CTA onGold a první snímek staré opičky, plynulost RingShatter/DotBurst, scroll ligy za 2. obrazovku, podstavec profilu 320 pt, hero sezóny 360 pt, fontScale 1.4.

## Fáze 3 + podněty z iPhonu HOTOVÉ — rating 100/100 (2026-10-06)
Reakce a život opičky, angličtina, Reset app, kompaktní mapa jedoucí pod hlavičkou, reaktivní pozadí všude, tab bar (ťuknutí + přejetí), nová oslava lekce s haptickým podpisem, barevný systém (docs/design/color-system.md), demo skip.
K ruční kontrole na iPhonu: haptika oslavy, tab bar a VoiceOver, četnost idle opičky, závoj mapy, Doto 24 pt na 320 pt, kontrast, Toggle/TextField hranice.

## Elite fáze 1 (vlajková linka) HOTOVÁ — rating 85/85 „čeká na iPhone“ (2026-10-07)
Krátký onboarding (cesta → narození → mapa, ~6 s do lekce), Finish setup / Set your goals, opička průvodce, let kotouče mapa → lekce → oslava, kompaktní lekce a mapa na 320 pt. QA 5 kol (výjimka zapsaná v LOG).
Čeká: uživatelovo „ok“ k iPhone checklistu (docs/QA.md, kolo 5). Otevřené (nízká priorita): `lastRect` letu přežije zavřenou lekci; eslint-disable exhaustive-deps bez důvodu v LessonMap/PlateNode; práh vizuálního diffu 1 % pustil malou změnu na w320 (zvážit snížit); hook neblokuje `npx kill-port 8082`.
Další podprojekty: 2 zvuk + haptika, 3 opička 2.0, 4 audit a řemeslo.

## Elite fáze 0 (workflow) HOTOVÁ — rating 85/85 „čeká na iPhone“ (2026-10-06)
Playwright v `e2e/` proti produkčnímu exportu (80 testů za ~3 min, perf 4/4), ochranný hook, ESLint worklet pravidlo, agenti se shellem, nová rubrika. Scroll jen při svislém tahu (scrollIntent).
Čeká: uživatelovo „ok“ k iPhone checklistu kola 2 (docs/QA.md) → 100/100. Otevřené: hook neblokuje `npx kill-port 8082` / dosazené PID; šatník vodorovné sloty na iOS.
Další podprojekty elite: 1 vlajková linka (first run → lekce → oslava), 2 zvuk + haptika, 3 opička 2.0, 4 audit a řemeslo (prompt `docs/prompts/2026-10-06-elite-ui-workflow.md`).

## Potom
- Nový plán napsat pro každou fázi zvlášť (superpowers:writing-plans).

## Praktické
- Metro „nesledoval změny“ jen proto, že běžel s `CI=1` (CI režim vypíná watch). Bez `CI=1` se změny propisují samy.
- Expo Go pro uživatele mimo Wi-Fi: Cloudflare quick tunnel (expo --tunnel/ngrok nefunguje, „remote gone away“). `cloudflared.exe tunnel --no-autoupdate --url http://localhost:8082` (binárka ve scratchpadu session), pak `EXPO_PACKAGER_PROXY_URL=https://<host>.trycloudflare.com npx expo start --port 8082`; v Expo Go `exps://<host>.trycloudflare.com`. Adresa tunelu je při každém spuštění nová. Server startovat BEZ `--clear` a po startu stáhnout bundle předem (`curl <tunel>/index.bundle?platform=ios&dev=true&...`), jinak první načtení na telefonu vyprší („Could not connect to development server“). Port 8081 = web pro agenty.
- Screenshoty: Playwright ve scratchpadu session (`tabs.js`, `shot.js`), Chrome z `C:/Program Files/Google/Chrome/Application/chrome.exe`. Demo profil se načte přes `/dev` → „Načíst demo profil“.
- Agenti design/motion nemají shell, takže tsc/jest/eslint po nich spouští boss.
