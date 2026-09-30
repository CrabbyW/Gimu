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
