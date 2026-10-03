# Chalk & Iron + posvátná geometrie (R43)

Zadání (uživatel, 2026-10-03): „less AI slop, polish, study colors“ → směr 1 Chalk & Iron, studium
barevných základů, „holy geometry“ varianta C (skrytý φ systém všude + jedna viditelná figura
v oslavě dokončení), světlý režim varianta A (stejné materiály, obrácené role).

## 1. Barvy — odvozené z materiálů, počítané v OKLCH

Proč: dosavadní Kurogane byla neutrální studená šeď z menu skillu, ember `#FF6B35` taky z menu.
Skill chce akcent ze světa předmětu.

- **Železo** (litina, kotouč): odstín h = 65° (teplá hnědošedá), chroma 0.004–0.008. Tmavé neutrály.
- **Křída** (magnézium): h = 95°, chroma 0.005–0.008, světlost 0.95. Text v dark, podklad v light.
- **Akcent = IWF červená 25 kg kotouče** (soutěžní barevný kód: 25 kg je červený). OKLCH(0.63 0.215 29)
  = `#EF3E31`. Jediný akcent, v obou režimech stejný, jen v oslavě dokončení / stage-up / recap.
  `accentText` dark `#F45343`, light `#B71B14`.
- Světlost neutrálů v rovnoměrných perceptuálních krocích (ΔL 0.035 base→surface→raised),
  kotouče dark v krocích ΔL 0.065 (plate5 L 0.53 → plate25 L 0.27).
- Kontrasty (ověřuje `theme/__tests__/contrast.test.ts`): text/base 16.6 (dark) a 15.8 (light),
  muted ≥ 5.2, accentText ≥ 4.88, onAccent na accent 4.65, inkOn na všech kotoučích ≥ 4.5.

Tabulka hodnot je v `theme/palettes.ts` (zdroj pravdy), generátor v komentáři u palety.

## 2. Posvátná geometrie — skrytý systém φ

φ = 1.618. Pravidlo: každá nová míra je φ-odvozená, nebo má komentář, proč ne (čitelnost).

- **Spacing**: beze změny — `4 8 16 24 40 64 104 168` už je φ od 24 výš.
- **Typová škála**: řada 16·√φⁿ (každé dva kroky = φ): 16 · 20 · 26 · 33 · 42 · 53 · 68 · 87 · 110.
  display 48→42, title 32→33, choiceTitle 24→26, counter 26, displayXL 104→110,
  Stat M 56→53, L 88→87, XL 120→110. Utility (label 11, caption 14, mono 10) mimo škálu — čitelnost.
- **Kotouč** (R = 48 ve viewBoxu 100): náboj R/φ² = 18.3, otvor R/φ³ = 11.3, lem 40 (fyzický lem, ne φ).
- **Mapa**: krok uzlů 112 → 104 (= 64·φ, token `xxxl`), amplituda sinusoidy w·0.28 → w/φ³ (0.236 w).
- **Radiusy**: s 6 → 5, l 12 → 8 (8/5 ≈ φ). Méně „bublina“, víc obrobený kov.

## 3. Viditelná figura — jen v oslavě dokončení lekce

Konstrukční kresba kotouče, který právě zacvakl: soustředné kružnice R, R/φ, R/φ², R/φ³ se středem
v pravém kotouči + zlatá spirála ze čtvrtkruhů vepsaná do zlatého obdélníku kolem osy.
- Vlasová linka 1 pt v `rule`, žádná výplň, žádný akcent.
- Nese informaci: je to konstrukce kotouče (stejné φ poměry jako `Plate`), objeví se v okamžiku dopadu.
- Pohyb: dokreslení (strokeDashoffset) 600 ms `ease.out` od dopadu, kružnice od nejmenší.
  Omezený pohyb: fade 200 ms.
- Nikde jinde v appce.

## 4. Co se nemění
Logika, data, copy, struktura obrazovek, maskot, sezónní neutrály (jen kontrola kontrastu), seasonGold.

## 5. Ověření
`npm test` (kontrast, geometrie), `tsc`, screenshoty dark/light 320 a 390 pt: mapa, lekce,
oslava, liga, profil. QA → rating 100/100 podle CLAUDE.md.
