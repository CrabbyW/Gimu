# Kde jsme skončili (aktualizováno 2026-10-06)

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

## Potom
- Fáze 3: 15 reakcí opičky (`logic/mascotReactions.ts`).
- Nový plán napsat pro každou fázi zvlášť (superpowers:writing-plans).

## Praktické
- Metro „nesledoval změny“ jen proto, že běžel s `CI=1` (CI režim vypíná watch). Bez `CI=1` se změny propisují samy.
- Expo Go pro uživatele mimo Wi-Fi: Cloudflare quick tunnel (expo --tunnel/ngrok nefunguje, „remote gone away“). `cloudflared.exe tunnel --no-autoupdate --url http://localhost:8082` (binárka ve scratchpadu session), pak `EXPO_PACKAGER_PROXY_URL=https://<host>.trycloudflare.com npx expo start --port 8082`; v Expo Go `exps://<host>.trycloudflare.com`. Adresa tunelu je při každém spuštění nová. Port 8081 = webový server pro screenshoty agentů.
- Screenshoty: Playwright ve scratchpadu session (`tabs.js`, `shot.js`), Chrome z `C:/Program Files/Google/Chrome/Application/chrome.exe`. Demo profil se načte přes `/dev` → „Načíst demo profil“.
- Agenti design/motion nemají shell, takže tsc/jest/eslint po nich spouští boss.
