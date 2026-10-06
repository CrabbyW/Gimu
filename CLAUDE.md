# Projekt: gamifikovaná kalistenika s maskotem opice
Specifikace produktu je v `docs/SPEC.md` (ulož tam celý původní zadávací prompt, pokud tam ještě není).

## Tým
- boss (hlavní konverzace): plánuje, deleguje, integruje, rozhoduje spory
- design-agent: vizuální systém, obrazovky, layout, typografie
- motion-agent: animace, přechody, haptika, maskot v pohybu
- qa-agent: funkčnost, logika, edge cases, testy
- rating-agent: finální hodnocení kroku 0–100 podle rubriky (krok pokračuje jen při 100/100)

## Pravidla pro všechny
- Specifikace (`docs/SPEC.md`) je zdroj pravdy. Když se s ní něco neshoduje, řekni to, nevymýšlej.
- Design tokeny jen z `theme/`. Žádné hardcoded barvy, fonty ani spacing.
- Data jen přes `services/`, herní logika jen v `logic/`.
- Každý agent na konci práce zapíše krátký záznam do `docs/LOG.md`: co udělal, co rozhodl sám, co zůstává otevřené.
- Nic není hotové, dokud to neschválí qa-agent.
- Porty: 8081 = web pro agenty (`npx expo start --web --port 8081`, nikdy v CI režimu — vypíná sledování změn). 8082 + cloudflared tunel = Expo Go uživatele na iPhonu: nesahat (hlídá hook `.claude/hooks/guard.mjs`).
- `docs/QA.md` a `docs/LOG.md` se jen doplňují na konec, nikdy nepřepisují (hlídá hook).
- Worklet pravidlo: ve workletu jen sdílené hodnoty a čísla, nikdy gesto, funkce ani objekt, který je obsahuje — na nativu to padá (hlídá ESLint `local/no-worklet-object-capture`).
- Každý agent ověřuje vlastní práci: `npx tsc --noEmit`, `npx jest`, `npx eslint .` a relevantní `npm run e2e*` (Playwright v `e2e/`).
- Commit s kódem po verdiktu QA vyžaduje nové QA; jinak rating neproběhne.
- Kolo končí iPhone checklistem pro uživatele (max. 5 bodů: haptika, safe area, VoiceOver, plynulost) a kontrolou nativního logu Expo serveru (`ERROR` = ❌).
- Rubrika ratingu (brány + 7 kategorií, výjimka 85/85 „čeká na iPhone“): `.claude/agents/rating-agent.md`.

## Workflow (BOSS)
1. Plán kroku: úkoly a agenti.
2. Základ (logika, services, typy, navigace) píše boss.
3. Design: design-agent.
4. Motion: motion-agent (nikdy paralelně s designem na stejných souborech).
5. QA: qa-agent.
6. Oprava (max 3 kola QA).
6b. Rating: rating-agent, jen 100/100 pouští dál (max 5 kol).
7. Shrnutí: hotovo, rozhodnutí agentů, otevřené, finální skóre, počet kol, položky „K ruční kontrole“.

Dokončení lekce (kotouč + opice) musí projít všemi agenty obzvlášť pečlivě.
