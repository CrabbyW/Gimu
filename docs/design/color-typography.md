# Color grading, kontrast a typografie: Kurogane

Stav: 2026-10-12, design-agent. Navazuje na `docs/design/color-system.md` (rampa neutrálů, data viz) a zpřesňuje směr Kurogane (černá ocel, monochrom + jeden akcent `live`). Hodnoty jsou v `theme/palettes.ts` a `theme/tokens.ts`, kontrast hlídá `theme/__tests__/contrast.test.ts` (blok „color typography“).

## 1. Look (grading)

Analogie s korekcí barev ve videu: lift = kde leží černá, gamma = střední tóny, gain = světla.

| Kanál | Rozhodnutí | Proč (jedna věta) |
|---|---|---|
| Lift (černá) | dark `base` #0B0B0C (L ≈ 0.155, téměř bez barvy), nikdy #000 | Zvednutá černá nechá dlaždice odlišit tónem a na OLED nezpůsobí rozmazané tmavé přechody při scrollu. |
| Gamma (střední tóny) | `tile` #131518 → `tilePressed` #1B1D20 → `edge` #2E3033, chladný grafit (OKLCH h 255, C ≤ 0.006) | Hloubka vzniká jasem po krocích +0.035 L, ne stínem; chladný nádech je tak slabý, že se čte jako „ocel“, ne jako modrá. |
| Gain (světla) | `text` #E9EBEE (L 0.94), nikdy #FFF | Text bez čisté bílé ani na tmavém pozadí nezáří, a přesto má 16.5:1. |
| Teplota | Neutrály chladné, akcent i opice teplé | Teplá červená na chladném podkladu je teplotní kontrast, takže akcent vyčnívá i při malé ploše. |
| Tint | Žádný zelený ani purpurový posun, jen osa modrá–oranžová | Ocel a papír mají v reálu tint neutrální, tónování do zelena by znečistilo opici. |
| Expozice a kontrast | Plný rozsah textu (16:1), ale plochy stlačené do L 0.155–0.31 | Vysoký kontrast patří jen informaci, prostředí zůstává „podexponované“ a klidné. |
| Saturace vs. vibrance | Neutrály mají sytost ≈ 0, akcent `live` má plnou sytost; stavové barvy v dark jsou světlejší a méně syté (L 0.70–0.83) | Jako vibrance: zesílit jen to, co je málo syté a důležité, a nesytit všechno plošně, protože syté barvy na černé vibrují. |
| Kdy look nepoužít | Opice, sezónní zlato a data viz se gradingem netónují | Look nesmí měnit význam: barva dat a maskota musí zůstat stejná v obou režimech. |

**Light** je inverze téhož looku: papír #F1F3F5 (lift vysoko, nikdy #FFF), text #15171A (gain dole, nikdy #000), stejný chladný odstín 255.

## 2. Harmonie

- **Monochrom + jeden akcent.** Celé UI je jedna odstínová osa (grafit h 255), jedinou sytou barvou je `live` (červená, h ≈ 25). Tahle harmonie nese hierarchii jen jasem, takže akcent nikdy nesoupeří s jinou barvou.
- **Komplement akcentu (azurová) se nepoužívá.** Komplementární pár červená–azurová by na tmavém pozadí vytvořil chromostereopsii (vibrující hranu); chladný nádech neutrálů je jen jeho stopa v sytosti ≈ 0.
- **Analogické, triadické a split-complementary harmonie** projekt nepoužívá, protože by do UI vnesly druhou a třetí barvu a porušily rozpočet akcentu. Jedinou výjimkou je data viz (`color-system.md` §7), kde barvy rozlišují kategorie, ne hierarchii.

## 3. 60-30-10

| Podíl | Role | Tokeny |
|---|---|---|
| 60 % | podklad | `base` |
| 30 % | plochy a struktura | `tile`, `tilePressed`, `edge`, `dotOff` |
| 10 % | informace | `text`, `muted`, `faint`, tečky; z toho `live` < 5 % (jen aktuální uzel, tečka radosti opice, oko siluety) |

Hierarchie barvou: na obrazovce je nejkontrastnější jedna věc (CTA nebo hero číslo, ~16:1), metadata ~7–8:1 (`muted`) a štítky ~5:1 (`faint`). Test hlídá, že text > muted > faint.

## 4. Změny v tomto kole

| Token | Před | Po | Proč |
|---|---|---|---|
| dark `live` | #E01B22 (4.07:1 na base, 3.79:1 na tile) | **#F0333A** (4.91 / 4.56) | Gain akcentu: vyšší jas při stejné sytosti dostane červenou přes 4.5:1, takže smí nést i malý text a v tmavé místnosti se „nepropadne“. |
| light `stateSuccess` | #21763C (proti `danger` 1.03:1) | **#145A2B** (1.43:1, na tile 8.03:1) | Úspěch a chyba měly stejný jas, takže pro protanopy a deuteranopy byly totožné; teď se liší i hodnotou. |

Tab bar se nemění (`tile`, `edge`, `tilePressed`, `text`, `muted` jsou beze změny). Opice (`mascot*`) a červená tečka oka siluety (`live`) zůstávají.

## 5. Červená a zelená

- Dokončení se v UI nikdy neukazuje zeleně: hotový uzel = plný disk `text` (tvar), aktuální = prstenec + `live` střed (tvar + barva), zamčený = řídké tečky `dotDim` + zámek.
- `stateSuccess` a `danger` se používají jen s ikonou nebo slovem (zóna ligy = trojúhelník nahoru/dolů + text). Navíc se liší jasem (dark 1.50:1, light 1.43:1), což test hlídá (≥ 1.2:1).
- `live` (červená) ≠ `danger`: dark `danger` #F66D67 je světlejší a méně sytý losos, který se objevuje jen jako text chyby, nikdy jako tečka.

## 6. WCAG 2.2 poměry (všechny páry)

Výpočet: relativní luminance sRGB (linearizace `c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`, váhy 0.2126/0.7152/0.0722), poměr `(L1 + 0.05) / (L2 + 0.05)`. Prahy: text AA 4.5:1 (velký ≥ 18.66 px tučně nebo 24 px: 3:1), AAA 7:1, grafika a hranice ovládacích prvků 3:1 (1.4.11). „Exempt“ = dekorace (význam nese text nebo tvar).

### Dark

| FG | BG | Role | Potřeba | Poměr | Úroveň |
|---|---|---|---|---|---|
| `text` #E9EBEE | `base` #0B0B0C | text | 7 | 16.47:1 | AAA |
| `text` #E9EBEE | `tile` #131518 | text | 7 | 15.31:1 | AAA |
| `text` #E9EBEE | `tilePressed` #1B1D20 | text | 7 | 14.14:1 | AAA |
| `muted` #A2A5A8 | `base` | text | 4.5 | 7.95:1 | AAA |
| `muted` #A2A5A8 | `tile` | text | 4.5 | 7.39:1 | AAA |
| `faint` #84868A | `base` | text | 4.5 | 5.39:1 | AA |
| `faint` #84868A | `tile` | text | 4.5 | 5.02:1 | AA |
| `onText` #0B0B0C | `text` (CTA) | text | 4.5 | 16.47:1 | AAA |
| `live` #F0333A | `base` | text/grafika | 4.5 | 4.91:1 | AA |
| `live` #F0333A | `tile` | text/grafika | 4.5 | 4.56:1 | AA |
| `live` #F0333A | `tilePressed` | grafika | 3 | 4.21:1 | AA (UI) |
| `live` #F0333A | `text` (prstenec) | grafika | 3 | 3.36:1 | AA (UI) |
| `danger` #F66D67 | `tile` | text | 4.5 | 6.36:1 | AA |
| `stateSuccess` #7CCD8E | `tile` | text | 4.5 | 9.56:1 | AAA |
| `stateWarning` #EEC05B | `tile` | text | 4.5 | 10.74:1 | AAA |
| `stateInfo` #7BB9E5 | `tile` | text | 4.5 | 8.63:1 | AAA |
| `borderStrong` #67696C | `base` / `tile` | grafika | 3 | 3.57 / 3.32:1 | AA (UI) |
| `text` | `dotOff` #292B2E (tečka zap./vyp.) | grafika | 3 | 11.89:1 | AAA |
| `mascotFur` #E9EBEE | `base` | grafika | 3 | 16.47:1 | AAA |
| `mascotFace` #3A3C40 | `mascotFur` | grafika | 3 | 9.25:1 | AAA |
| `mascotEye` #E9EBEE | `mascotFace` | grafika | 3 | 9.25:1 | AAA |
| `mascotProp` #84868A | `base` | grafika | 3 | 5.39:1 | AA |
| `onSeasonGold` #181613 | `seasonGold` #C6A15B | text | 4.5 | 7.44:1 | AAA |
| `stateSuccess` | `danger` | rozdíl hodnoty | 1.2 | 1.50:1 | ok |
| `dotDim` #4E5053 | `base` | dekor | — | 2.43:1 | exempt |
| `edge` #2E3033 | `tile` | dekor | — | 1.38:1 | exempt |
| `dotOff` #292B2E | `base` | dekor | — | 1.39:1 | exempt |

### Light

| FG | BG | Role | Potřeba | Poměr | Úroveň |
|---|---|---|---|---|---|
| `text` #15171A | `base` #F1F3F5 | text | 7 | 16.14:1 | AAA |
| `text` #15171A | `tile` #FAFBFD | text | 7 | 17.34:1 | AAA |
| `text` #15171A | `tilePressed` #E7EAED | text | 7 | 14.87:1 | AAA |
| `muted` #595B5E | `base` / `tile` | text | 4.5 | 6.12 / 6.58:1 | AA |
| `faint` #67696C | `base` / `tile` | text | 4.5 | 4.95 / 5.32:1 | AA |
| `onText` #F1F3F5 | `text` (CTA) | text | 4.5 | 16.14:1 | AAA |
| `live` #D0161D | `base` / `tile` | text/grafika | 4.5 | 4.95 / 5.32:1 | AA |
| `live` #D0161D | `tilePressed` | grafika | 3 | 4.56:1 | AA (UI) |
| `live` #D0161D | `text` (prstenec) | grafika | 3 | 3.26:1 | AA (UI) |
| `danger` #C2272D | `tile` | text | 4.5 | 5.60:1 | AA |
| `stateSuccess` #145A2B | `tile` | text | 4.5 | 8.03:1 | AAA |
| `stateWarning` #A46400 | `tile` | text | 4.5 | 4.61:1 | AA |
| `stateInfo` #006AA0 | `tile` | text | 4.5 | 5.68:1 | AA |
| `borderStrong` #84868A | `base` / `tile` | grafika | 3 | 3.28 / 3.52:1 | AA (UI) |
| `text` | `dotOff` #D5D8DB | grafika | 3 | 12.55:1 | AAA |
| `mascotFur` #15171A | `base` | grafika | 3 | 16.14:1 | AAA |
| `mascotFace` #D5D8DB | `mascotFur` | grafika | 3 | 12.55:1 | AAA |
| `mascotEye` #15171A | `mascotFace` | grafika | 3 | 12.55:1 | AAA |
| `mascotProp` #67696C | `base` | grafika | 3 | 4.95:1 | AA |
| `onSeasonGold` | `seasonGold` | text | 4.5 | 7.44:1 | AAA |
| `stateSuccess` | `danger` | rozdíl hodnoty | 1.2 | 1.43:1 | ok |
| `dotDim` #A2A5A8 | `base` | dekor | — | 2.23:1 | exempt |
| `edge` #D2D4D8 | `tile` | dekor | — | 1.43:1 | exempt |
| `dotOff` #D5D8DB | `base` | dekor | — | 1.29:1 | exempt |

Kontrast mezi hodnotou, barvou a sytostí: hierarchie v UI stojí jen na **hodnotovém** kontrastu (jas). **Barevný** kontrast (odstín) má jen `live` proti grafitu a **sytostní** kontrast ho zesiluje (sytá červená mezi nesytými tóny). Proto akcent funguje i v odstínech šedi: v obou režimech má proti podkladu ≥ 4.5:1.

## 7. Typografie

Tři rodiny, každá s jednou rolí (vše Google Fonts, licence SIL OFL 1.1, přes `@expo-google-fonts/*`):

| Rodina | Klasifikace | Role | Proč |
|---|---|---|---|
| **Doto 700** | dot-matrix display (geometrický, monospace) | hero čísla, titulky obrazovky, kg; jen ≥ 28 pt | Číslo je hrdina a tečkový řez mluví stejným jazykem jako kotouče a mapa; pod 28 pt se tečky slévají. |
| **Inter 300/400/600** | neo-grotesk sans | veškerý čtený text, názvy lekcí, tab bar | Vysoká x-výška a tabulární číslice (tnum) jsou čitelné i na 320 pt; řezy 300/600 dávají kontrast bez třetí rodiny. |
| **JetBrains Mono 500** | monospace (humanist) | štítky VERZÁLKAMI, akce `[V ZÁVORKÁCH]`, telemetrie | Pevná šířka zarovná metadata do sloupců a odliší „přístrojový“ hlas od čteného textu. |

Bebas Neue je v `package.json`, ale nenačítá se (R42), takže čtvrtá rodina v appce není. Párování: kontrast struktury (tečky × grotesk × mono), ne podobnosti; dva sans fonty by soupeřily.

### Typová škála (pt, line-height, tracking)

Základ 16 · √φⁿ (dva kroky = φ ≈ 1.618): 16 · 20 · 26 · 33 · 42 · 53 · 68 · 87 · 110; utility mimo škálu kvůli čitelnosti.

| Token | Rodina | Velikost / řádek | LH poměr | Tracking | Použití |
|---|---|---|---|---|---|
| `displayXL` | Doto | 110 / 143 | 1.30 | 0 | oslava, jedno číslo |
| `hero` | Doto | 64 / 84 | 1.31 | 0 | hero číslo obrazovky |
| `heroShort` | Doto | 42 / 56 | 1.33 | 0 | hero na 568 pt |
| `display` | Doto | 40 / 52 | 1.30 | 0 | titulek obrazovky |
| `dotStat`, `dotTitleShort` | Doto | 28 / 36 | 1.29 | 0 | číslo dlaždice (spodní hranice Doto) |
| `counter`, `choiceTitle` | Inter 300 | 26 / 32 (30) | 1.23 | −0.03 em | počítadla ligy, volby |
| `title` | Inter 600 | 24 / 30 | 1.25 | −0.01 em | nadpis sekce |
| `stat` | Inter 600 | 20 / 24 | 1.20 | 0 | čísla statistik |
| `headline` | Inter 600 | 18 / 24 | 1.33 | 0 | název lekce, titulek karty |
| `body` / `bodyStrong` | Inter 400/600 | 16 / 24 | 1.50 | 0 | čtený text |
| `caption` | Inter 400 | 13 / 18 | 1.38 | 0 | popisky |
| `pill` | Mono 500 | 13 / 16 | 1.23 | +0.12 em | `[START LESSON]` |
| `label`, `telemetry` | Mono 500 verzálky | 11 / 14 (16) | 1.27 | +0.18 / +0.20 em | štítky, metadata |
| `tab` | Inter 600 | 11 / 14 | 1.27 | 0 | tab bar (beze změny) |

Pravidla, která škála dodržuje:
- **Line-height klesá s velikostí:** tělo 1.5, nadpisy 1.2–1.33; Doto má 1.3 kvůli vysokým dotahům a české diakritice nad verzálkami.
- **Tracking:** velké Inter titulky se lehce stahují (−0.01 až −0.03 em), verzálky v mono se rozpalují (+0.12 až +0.20 em), protože verzálky bez rozpalu tvoří hustý blok. Doto má tracking vždy 0, jinak by se tečky sousedních znaků slily nebo rozpadly.
- **Délka řádku:** tělo 16 pt na 320–430 pt šířky = zhruba 35–50 znaků, tedy pod horní hranicí 75 znaků. Delší odstavce se v appce nevyskytují a copy je psaná na 1–2 řádky.
- **Řez místo velikosti:** hierarchii v malém textu nese řez (600 vs. 400) a barva (`text` vs. `muted`), ne další stupeň velikosti.
- **Tabulární číslice** u všech čísel (`tabularNums`), aby se odpočty a XP při změně nehýbaly.

## 8. Použitá pravidla (shrnutí)

1. Lift/gamma/gain: černá zvednutá na L 0.155, střední tóny po krocích +0.035 L, světla na L 0.94; bez #000 a #FFF.
2. Teplotní kontrast: chladné neutrály a teplý akcent i maskot.
3. Vibrance místo saturace: sytost má jen akcent, stavové barvy jsou v dark zesvětlené a odsycené.
4. Look netónuje význam (opice, data, zlato).
5. Harmonie monochrom + jeden akcent, bez komplementu akcentu (kvůli chromostereopsii).
6. 60-30-10 a rozpočet akcentu < 5 %.
7. Hierarchie hodnotovým kontrastem: text ~16:1 > muted ~7:1 > faint ~5:1.
8. WCAG 2.2: text ≥ 4.5:1 (hlavní ≥ 7:1 AAA), grafika ≥ 3:1, dekorace exempt jen když význam nese tvar nebo slovo.
9. Červená a zelená nikdy samy o sobě: tvar, slovo a odlišný jas.
10. Nanejvýš 3 rodiny s rozdělenými rolemi, škála √φ, LH 1.5 → 1.2, tracking + pro mono verzálky a − pro velké titulky, řádek ≤ 75 znaků, tabulární číslice.
