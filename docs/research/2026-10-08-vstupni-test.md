# Rešerše: vstupní test, dávkování a bezpečnost (2026-10-08)

Podklad pro elite fázi 5. Zdroje jsou veřejné webové stránky, ne odborná recenze. Čísla v appce jsou proto konzervativní a dají se změnit na jednom místě (`logic/fitnessTest.ts`, `FITNESS`).

## Co jsme zjistili
- **Kliky (ACSM push-up test):** maximum v kuse se správnou technikou, bez časového limitu, normy podle věku a pohlaví v pěti pásmech. Např. muži 20–29: průměr 35–44, slabý 20–34. Ženy 20–29: průměr 17–33. Norma je orientační.
  Zdroje: https://trainrboost.com/tools/push-up-test, https://fitnessnorms.com/strength/push-ups/, https://www.topendsports.com/testing/tests/home-pushup.htm
- **Plank:** netrénovaní 10–20 s, běžná populace 30–60 s průměr, 1–2 min dobrý výkon. Doporučení pro většinu lidí: sety 20–60 s.
  Zdroje: https://fitnessdrum.com/average-plank-time-standards-by-age/, https://theblogtimer.com/guides/how-long-to-hold-a-plank
- **Submaximální dávkování:** začátečníci mají cvičit s rezervou (RPE ~7, „3 opakování v záloze“), rozcvičovací sérii kolem 50 % maxima a přidávat po malých krocích (+1 opakování, +5 s).
  Zdroje: https://www.gymnasetips.com/beginner-calisthenics-routine/, https://www.calisthenics-101.co.uk/how-to-start-calisthenics-a-beginners-guide
- **Připravenost (PAR-Q+ 2024):** 7 obecných otázek (srdce/tlak, bolest na hrudi, závratě/bezvědomí, chronická nemoc, léky, problém kostí/kloubů, lékařský dohled). Všechna „ne“ = bez omezení, jinak poradit se s odborníkem.
  Zdroj: https://www.surrey.ca/sites/default/files/media/documents/ParQ-Plus-2024-pdf.pdf

## Rozhodnutí pro appku
- Dávka v lekci = 50 % maxima z testu vůči referenci (klik 8 = test 16, plank 30 s = test 60 s), násobek omezený na 0.5–1.5×.
- Kliky na kolenou = polovina hodnoty. Výdrže zaokrouhlené na 5 s.
- PAR-Q+ jen informuje (doporučí lékaře), neblokuje. Appka není lékařská rada.
- **Co tím NENÍ zaručeno:** správná technika, individuální rozdíly (věk, hmotnost, zranění), vhodnost konkrétních cviků. Doporučeno: kontrola trenérem/fyzioterapeutem.
