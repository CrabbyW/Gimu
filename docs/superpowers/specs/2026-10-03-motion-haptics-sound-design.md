# Pohyb, haptika a zvuk – DRAFT specifikace (kolo 2)

Stav: **DRAFT kolo 2** (motion-agent, 2026-10-03). Bez kódu v repu; implementace až po schválení bossem.
Stack: Expo 57, React Native 0.86, Reanimated 4.5, react-native-worklets 0.10, expo-haptics, expo-audio. iOS dark mode, Expo Go.
Souvisí s: `docs/SPEC.md` §6.7, §7.3, §7.4; vizuální spec „Teplá litina“ (`2026-10-03-tepla-litina-redesign-design.md`, vlastní design-agent). Barvy zde jen jako role/tokeny z `theme/`, hodnoty vlastní design-agent.

Tokeny, které tato spec čte z vizuální spec: `scrim`, `scrimSoft`, `scrimDeep`, `accent`, `accentPressed`, `raised`, `raisedPressed`, `accentGraphic` (light), `onAccent`, `celebrate.ring`, `celebrate.spark`, `plate*`, `text`, `muted`, `faint`.

---

## 0. Změny v kole 2

**Rozhodnutí uživatele**
- Streak = **činka plná kotoučů**, plamen a jiskry vyřazeny všude. Nový moment „nacvaknutí kotouče série“ (§2.2, §3.6, §4.1): malý kotouč dosedne na činku v pilulce, krátká verze `motion.seat`, haptika rigid light.
- Zvuky z Kenney CC0 (`tick`, `ring`, `gong`: suché kovové/dřevěné, zkrácené) (§6.1).
- Délka lekce a odznaky přicházejí z dat (boss); motion je jen čte.

**Rozhodnutí bosse**
- AHAP i APPROX přepočítány: **t=0 = dopad (heavy)**, rigid +80, ring 160–860, success 1250. Rozporná poznámka z §10.3 smazána.
- Oslava (a) zeštíhlena: CTA „Pokračovat“ v **1200 ms**; XP ticky max 8; opička póza `celebrate` (paže nahoru, bez poskoku) + jantarová hrana šálu fade 200 ms; nový řádek „Zítra: …“. Kývnutí hlavy a zhoupnutí šálu z (a) vypuštěny.
- Denní cíl vypuštěn (žádné sloty, žádný shimmer). Připomínka patří do onboardingu.
- Odstraněno: glow aktivního uzlu (dech = prstenec opacita 1↔0.6 + scale), shimmer progress baru, parallax mřížky, stín řádku ligy. Oči sledující prst přesunuty do „Později“.
- Haptika zredukována (§2): zrušena na buňkách mřížky, splitflapu, pohlazení opice, 100 % progress baru, zrychlení posledních 5 s výdrže. Smutná opička bez haptiky.
- Konfety (b): převážně `plate*`/`muted`, max 3 jantarové; na akcentové ploše stage-up `onAccent` + `raised`.
- Nálady MVP: `idle`/`celebrate`/`sad`. `curious`/`focused`/`sleeping` do „Později“; `sleeping` nikdy podle hodiny, jen po dlouhé nečinnosti.

**Nálezy QA**
- `'tapLight'` v `FeedbackId`; `motion.cvak` se zavádí ve fázi 1 (§1.2, §6.3).
- Sync přepsán na **±1 snímek (16 ms, max 33 ms)**; kroky se spouští z UI vlákna `withDelay` + `scheduleOnRN` od sdíleného času scény, ne `setTimeout` (§4.4).
- Idempotentní `skipToEnd()` (§4.4); `play()` drží jediný aktivní vzor (§10.3).
- XP count-up: `useAnimatedProps` na `TextInput`, fallback re-render jen při ticku, ověřit na Fabric (§10.2).
- Konfety: jeden sdílený progress, parametry předpočítané (§4.2).
- `perfTier` určen při startu a uložen, ne během první oslavy (§7.3).
- Ducking: zapnout při vstupu do scény, vrátit v cleanupu i `skipToEnd`; pravidlo o čtení tichého přepínače škrtnuto (`playsInSilentMode: false` stačí). Zvuky = singletony `createAudioPlayer` při startu. Haptika a zvuk = dva nezávislé přepínače (§6.2, §7.2).
- §1 odkazuje na výjimku `motion.seat`. Reduce Motion (a) sladěno s kódem (calm fade v `LessonCompleteScene`).
- Chyba uložení XP jen lokálně (persist store), žádný síťový sync (§7.5).

**Nálezy motion→design review**
- Opička na kotouči je sourozenec, během sezení na uzlu vlastní dech vypnutý (§3.1).
- Přeskok opičky na nový uzel: oblouk, fall, settle, soft haptika (§3.1).
- `sad`→`idle` přes `moodShift` 300 ms bez skoku (§5.2).
- Odemčení: obrys `faint` fade-out, litina fade-in, Lock fade 120 ms, trim prstence `accent`, scale 0.92→1 (§3.1).
- Hotový uzel = trim fajfky 300 ms v `text` (§3.1).
- Tečka tabu: scale/opacity Cvak 120 ms (§3.7).
- Prázdná liga = fade `LockedPreview` 200 ms bez maskota (§3.2).
- Progres prázdný stav dle vizuální spec (jeden týden) (§3.3).

---

## 1. Filozofie pohybu

**Teze: Odměna se pozná podle toho, že se zastaví čas.** Běžné UI je rychlé a suché, takže když se něco zpomalí, uživatel ví, že jde o důležitý moment.

Pravidla (závazná):

1. **Odezva < 100 ms.** Každý dotyk má vizuální stlačení v prvním rámu (`onPressIn`); haptiku jen tam, kde ji uvádí §2. Stav appky se mění hned, animace ho jen znázorní.
2. **Těžké, ne gumové.** Rychlý začátek, kontrolované dosednutí, maximálně jeden sotva viditelný přestřel. ζ ≥ 0.6, **jediná výjimka `motion.seat`** (ζ 0.55, dopad kotouče na osu, viz §1.2 a §11).
3. **Klikací prvky jen timing `Cvak`**, bez pružiny. Pružiny patří objektům ve světě appky (kotouč, uzel, opička, řádek ligy při přesunu).
4. **Méně pohybu, přesněji.** V jednu chvíli nejvýš jedna věc, která si žádá pozornost. Idle smyčky jen u aktivního uzlu a u maskota.
5. **Jeden akcent.** Jantar se hýbe jen u CTA, kotouče série, prstence aktivního uzlu a oslavy.
6. **Reduce motion je plnohodnotná varianta**: prolnutí 200 ms, haptika a zvuk zůstávají.

### 1.1 Tři pojmenované křivky

| Název | Typ | Parametry | ζ | Použití |
|---|---|---|---|---|
| **Kotouč** | `withSpring` | `{ damping: 26, stiffness: 300, mass: 1 }` | ≈ 0.75 | přesuny karet, odemykání uzlů, kotouč do středu scény, řádek v lize |
| **Šál** | `withSpring` | `{ damping: 14, stiffness: 120, mass: 1 }` | ≈ 0.64 | jen maskot (šál, hlava) |
| **Cvak** | `withTiming` | `{ duration: 120, easing: ease.out }` | – | tap, záložka, toggle, návrat tlačítka |

### 1.2 Mapování na `lib/motion.ts`

| Existující token | Osud |
|---|---|
| `motion.press` (90 ms) | zůstává (stisk) |
| `motion.release` (220 ms) | alias → `cvak` (120 ms) |
| `motion.toggle` | alias → `cvak`; `motion.slide` zůstává |
| `motion.ui` (180 ms) | zůstává |
| `motion.unlock`, `motion.pop` | alias → `kotouc` |
| `motion.settle` {29,300} | zůstává (dosednutí opice po skoku) |
| `motion.slam` {33,420} | zůstává (+XP) |
| `motion.seat` {25,520,v260} ζ 0.55 | **jediná výjimka z ζ ≥ 0.6**; dopad kotouče na osu i (zkráceně) kotouč série |
| `motion.rattle`, `motion.fall`, `ease.gravity` | zůstávají |
| `motion.moodShift` (300 ms) | zůstává |
| `motion.calmFade` (200 ms) | zůstává (reduce motion) |

Nové tokeny, **zavádí se ve fázi 1** (MVP bod 1): `motion.cvak`, `spring.kotouc`, `spring.sal`, `dur.micro = 120`, `dur.standard = 320`, `dur.celebrate = 1200`. Do jejich zavedení se nikde v kódu neodkazují.

### 1.3 Časová škála

| Pásmo | Rozsah | Příklady |
|---|---|---|
| Mikro | 80–150 ms | vtlačení, tab, tick, shake krok |
| Standard | 250–400 ms | nástup karty, sheet, splitflap, circle reveal |
| Oslava | 800–1600 ms | dokončení lekce, sekce, posun v lize |
| Strop | 2000 ms | nic delšího bez možnosti přeskočit tapem |

---

## 2. Haptická mapa (redukovaná)

Konvence: `light/medium/heavy/rigid/soft` = `impactAsync`; `selection` = `selectionAsync()`; `success/warning` = `notificationAsync`. Intenzita 0–1 je cíl pro AHAP; v Expo Go ji aproximuje styl. Vše přes `feedback(id)` (§6.3). **Co tu není, haptiku nemá.** `error` se nepoužívá nikde.

| Moment | Spouštěč | Haptika | Int. | Načasování | Zvuk |
|---|---|---|---|---|---|
| Tap záložky | `onPressIn` tab baru | selection | 0.4 | t=0 | – |
| Primární tlačítko (CTA, „Začít lekci“, onboarding další) | `onPressIn` | medium | 0.6 | t=0 | – |
| Odpočet 3 / 2 | číslo nastoupí | light | 0.35/0.4 | se scale 1.2→1 | `tick` |
| Odpočet 1 | číslo nastoupí | rigid | 0.7 | dtto | `tick` |
| Odpočet 0 / „Teď“ | start cviku | heavy | 1.0 | t=0 | `plate` (zkrácený 150 ms) |
| Výdrž běží | každých 10 s | soft | 0.3 | na celé desítce | – |
| Výdrž posledních 5 s | 5, 4, 3, 2, 1 | soft, light, light, medium, medium | 0.3→0.6 | na celé sekundě, interval 1000 ms, **bez zrychlení** | `tick` jen 3, 2, 1 |
| Konec výdrže | `holdDone` | heavy | 0.9 | t=0 | `plate` |
| Dopad kotouče (oslava) | `onImpact` | heavy (AHAP t=0) | 1.0 | t=0 | `plate` |
| Nacvaknutí kotouče série | kotouč dosedne na činku v pilulce | rigid, styl light | 0.4 | při dosednutí | `tick` |
| Tap zamčeného uzlu | `onPress` | warning + shake | 0.5 | t=0 | – |
| Odemčení uzlu | uzel přejde do `available` | rigid → soft +90 ms | 0.7/0.3 | rigid na konci trimu prstence, soft při dosednutí | `unlock` |
| Přeskok opičky na nový uzel | dosednutí `settle` | soft | 0.3 | při dosednutí | – |
| Tick kolečka hodnoty (Sezóna) | každý krok | selection | 0.3 | při překročení kroku (mechanický feel) | – |
| Oslavy (a)(b)(c), sekce, liga, stage-up | §2.1 | AHAP | – | §2.1 | §6 |
| Validační chyba formuláře | submit | warning + shake | 0.5 | t=0 | – |

**Bez haptiky (zrušeno v kole 2):** buňky mřížky Progresu, splitflap, pohlazení opice, 100 % progress baru, zrychlení posledních 5 s výdrže, sekundární tlačítka, toggly, pull to refresh, sheet detent, long press, pauza, recap swipe, smutná opička i ztráta série, chyba uložení XP.

### 2.1 AHAP vzory (oslavy)

Soubory `assets/haptics/*.ahap`. V dev buildu je přehraje budoucí nativní modul (CHHapticEngine); v Expo Go `APPROX` v `lib/haptics.ts`. **Ve všech vzorech t=0 = dopad kotouče (heavy)**, `play()` se volá v `onImpact`. Spojité eventy Expo Go neumí, aproximují se řadou transientů.

#### (a) `lesson-complete.ahap`

```json
{
  "Version": 1.0,
  "Metadata": { "Project": "Opice", "Created": "2026-10-03", "Description": "Lesson complete: impact, lock, ring swell, success" },
  "Pattern": [
    { "Event": { "Time": 0.0, "EventType": "HapticTransient",
      "EventParameters": [ { "ParameterID": "HapticIntensity", "ParameterValue": 1.0 }, { "ParameterID": "HapticSharpness", "ParameterValue": 0.5 } ] } },
    { "Event": { "Time": 0.08, "EventType": "HapticTransient",
      "EventParameters": [ { "ParameterID": "HapticIntensity", "ParameterValue": 0.7 }, { "ParameterID": "HapticSharpness", "ParameterValue": 0.9 } ] } },
    { "Event": { "Time": 0.16, "EventType": "HapticContinuous", "EventDuration": 0.7,
      "EventParameters": [ { "ParameterID": "HapticIntensity", "ParameterValue": 0.6 }, { "ParameterID": "HapticSharpness", "ParameterValue": 0.2 } ] } },
    { "ParameterCurve": { "ParameterID": "HapticIntensityControl", "Time": 0.16,
      "ParameterCurveControlPoints": [ { "Time": 0.0, "ParameterValue": 0.33 }, { "Time": 0.55, "ParameterValue": 1.0 }, { "Time": 0.7, "ParameterValue": 0.0 } ] } },
    { "Event": { "Time": 1.25, "EventType": "HapticTransient",
      "EventParameters": [ { "ParameterID": "HapticIntensity", "ParameterValue": 0.9 }, { "ParameterID": "HapticSharpness", "ParameterValue": 0.6 } ] } }
  ]
}
```
Ring 160–860 ms (0.2→0.6), success 1250. XP ticky a kotouč série se hrají zvlášť (dynamické), ne v AHAP.
**APPROX:** `[0 heavy] [80 rigid] [160 soft] [320 soft] [480 light] [620 light] [760 medium] [1250 success]`.

#### (b) `milestone.ahap` – konec sekce, postup divize

Stejný začátek jako (a) (0 heavy, 80 rigid), spojitý pruh 160–1260 ms (0.8 × 0.25→1.0→0), dva závěrečné údery v 1.26 s (1.0) a 1.38 s (0.5), success 1460.
**APPROX:** `[0 heavy] [80 rigid] [200 soft] [360 soft] [520 light] [680 medium] [840 medium] [1260 heavy] [1380 light] [1460 success]`.

#### (c) `gong.ahap` – nový rekord, první stojka, stage-up

0 heavy (dopad, 1.0/0.5), pak **600 ms haptického ticha** („zastavení času“), 0.6 s úder 1.0 sharpness 0.35, spojitý dozvuk 0.62–2.82 s, intenzita 1.0→0.55→0.2→0 (exponenciální), sharpness 0→-0.3.
**APPROX:** `[0 heavy] [600 heavy] [640 heavy] [800 medium] [1050 soft] [1400 soft] [1900 soft]`.

Další (jen transienty, aproximace 1:1): `section-unlock` = (b) bez posledních dvou úderů; `league-rise` (3 ticky 0.3/0.5/0.7, rozestup 110 ms); `unlock` (rigid, soft +90).

---

## 3. Animace po obrazovkách

Všude: první zobrazení v relaci (`useFirstShow`) hraje intro, další návraty jen 180 ms fade. Idle smyčky se zastavují při ztrátě fokusu (`useIsFocused`).

### 3.1 Trénink (mapa)

| Prvek | Animace | Parametry |
|---|---|---|
| Vstup | stávající `intro.map`, kotouče `spring.kotouc` | zachovat (QA ověřeno) |
| Aktivní uzel – dech | **prstenec** opacita 1↔0.6 + scale uzlu 1.0↔1.03 z jednoho shared value | `withRepeat(withTiming(1, {duration: 1200, easing: ease.sine}), -1, true)`, perioda 2.4 s; žádný glow |
| Opička na aktivním uzlu | **sourozenec** uzlu (ne potomek), scale uzlu ji nepohybuje; vlastní dech opičky během sezení na uzlu **vypnutý** | zabraňuje dvojímu dechu |
| Přeskok opičky na nový uzel | po odemčení: odraz → oblouk (`motion.fall`, `ease.gravity`) → dosednutí `motion.settle` | soft 0.3 při dosednutí; spouští se po dosednutí odemčeného uzlu (+120 ms) |
| Hotový uzel | **trim fajfky** v `text`, 300 ms ease.out (`strokeDashoffset`) | jen pro uzel dokončený v této relaci |
| Cesta mezi uzly | dash offset 500 ms ease.out, délka předpočítaná | po trimu fajfky +100 ms |
| Odemčení | obrys `faint` fade-out 200 ms; litinová výplň fade-in 200 ms; ikona Lock fade 120 ms; trim prstence v `accent` 400 ms; scale 0.92→1 `spring.kotouc` | rigid na konci trimu, soft při dosednutí (+90) |
| Zamčený tap | translateX 0→3→-3→3→0, 4× 60 ms Cvak | warning |

Parallax mřížky odstraněn.

### 3.2 Liga

| Prvek | Animace | Parametry |
|---|---|---|
| Vstup řádků | fade + rise 8 pt, 40 ms/řádek, strop 360 ms | `enterRise` |
| Posun nahoru | řádek přejede o N pozic `spring.kotouc`, ostatní `LinearTransition` (26/300); **bez stínu a bez scale** | `league-rise` ticky (max 3) |
| Přeskočený řádek | propad 4 pt a zpět, 200 ms Cvak | – |
| XP count-up | 700 ms ease.out, viz §10.2 | – |
| Sestup | `motion.moodShift` 300 ms | bez haptiky |
| Prázdná liga | `LockedPreview` fade 200 ms, **bez maskota**, bez smyčky | – |

### 3.3 Progres

| Prvek | Animace | Parametry |
|---|---|---|
| Mřížka aktivity | diagonální vlna `(col + row) * 20 ms`, fade + scale 0.8→1, 180 ms | bez haptiky |
| Tap buňky | circle reveal 300 ms ease.out | bez haptiky |
| Progress bar | fill 400 ms ease.out | bez shimmeru, bez haptiky na 100 % |
| Graf | `strokeDashoffset` 900 ms (`intro.chart`) | zachovat |
| Prázdný stav | dle vizuální spec: **jeden týden** (7 buněk), jeden fade 200 ms, bez pohybu | – |

### 3.4 Sezóna

| Prvek | Animace | Parametry |
|---|---|---|
| Počítadlo dnů | splitflap rotateX 0→-90° (175 ms) + -90→0 (175 ms), `perspective: 600` | bez haptiky |
| Sheet s kolečkem | sheet `spring.kotouc`, backdrop `scrimSoft` 0→1 za 250 ms | kolečko selection na krok |
| Potvrzení | check trim 300 ms ease.out, medium na tlačítku | `plate` |
| Recap | slide 200 ms (`motion.slide`), 24 pt | – |

### 3.5 Profil

| Prvek | Animace | Parametry |
|---|---|---|
| Mrknutí | víčko scaleY 1→0.1→1 (60 + 90 ms), interval 4–7 s, 15 % dvojité | plánuje UI vlákno (`withDelay` s náhodným zpožděním v workletu) |
| Dech | 1.0→1.015, perioda 3 s, ease.sine | – |
| Pohlazení | kývnutí `spring.sal` | **bez haptiky** |
| Count-up XP | 700 ms | §10.2 |

### 3.6 Série (činka plná kotoučů)

Pilulka série v hlavičce ukazuje činku; každý den série = jeden malý kotouč.
- **Nacvaknutí kotouče série**: malý kotouč přiletí 12 pt shora, dosedne `motion.seat` zkrácený (`{25,520}`, bez počáteční rychlosti, ~220 ms), osa činky mikro-rozkmit `motion.rattle` amplituda 1 pt. Haptika rigid light 0.4, zvuk `tick`. Spouští se v oslavě (a) v t=900 a při prvním zobrazení mapy po lekci, pokud oslava byla přeskočena dřív (jen jednou).
- **Ztráta série**: kotouče sjedou z činky `motion.moodShift` 300 ms, fade na `faint`. Bez haptiky.

### 3.7 Tab bar

Tečka aktivního tabu: scale 0→1 + opacita 0→1, Cvak 120 ms; odcházející tečka obráceně. Selection na `onPressIn`.

---

## 4. HLAVNÍ MOMENT: dokončení lekce

Výchozí bod: `components/lesson/LessonCompleteScene.tsx`. **Zachovat**: pád kotoučů (`motion.fall`, `ease.gravity`), dosednutí `motion.seat`, rozkmit `motion.rattle`, punch, žár (`celebration.heat`). **t=0 = dopad pravého kotouče (`onImpact`)**.

Logika (XP zapsáno, série navýšena, uzel odemčen) proběhne **před** spuštěním scény. Scéna jen ukazuje hotový stav; přeskočení ani pád appky nic neztratí.

### 4.1 Úroveň (a): běžná lekce, CTA v 1200 ms

| t (ms) | Vizuál | API | Haptika | Zvuk |
|---|---|---|---|---|
| -690 | fade-in scény, start kotoučů (launch 250 + fall 440) | stávající | – | – |
| 0 | dopad, punch 1.018, žár; ducking zapnut už při vstupu do scény | stávající | heavy 1.0 | `plate` |
| 0 | pozadí → `scrim` | `withTiming(1, {duration: 240, easing: ease.out})` na opacitu vrstvy | – | – |
| 80 | „zámek“ | – | rigid 0.7 | – |
| 120 | pravý kotouč do středu, scale 1→2.2 | `spring.kotouc` | – | – |
| 160–860 | ring `celebrate.ring`: trim 0→100 % + opacita 0→1, 700 ms ease.out | `useAnimatedProps` `strokeDashoffset` | AHAP spojitý 0.2→0.6 | `ring` (zkrácený ~900 ms) |
| 500 | +XP slam 1.2→1 | `motion.slam` | – | – |
| 500–1150 | count-up XP 650 ms | §10.2 | selection, **max 8 ticků** | `tick` jen první a poslední |
| 900 | nacvaknutí kotouče série (§3.6) | `motion.seat` zkrácený | rigid light 0.4 | `tick` |
| 950 | opička → `celebrate` (paže nahoru, **bez poskoku**); jantarová hrana šálu fade 0→1, 200 ms | `motion.moodShift` pro pózu, `withTiming` 200 ms | – | – |
| 1000 | titulek „Lekce hotová“ fade + rise 8 pt | `motion.enter` | – | – |
| 1100 | řádek „Zítra: …“ (další lekce z dat) fade 200 ms | `motion.enter` | – | – |
| 1200 | CTA „Pokračovat“ fade 0→1, interaktivní | `motion.reveal`, bez pulzu | – | – |
| 1250 | – | – | success | – |

Přeskočení: tap kamkoli od t=-690 → `skipToEnd()` (§4.4).

### 4.2 Úroveň (b): milník / konec sekce

Vše z (a), navíc / jinak:

| t (ms) | Co | Parametry |
|---|---|---|
| 0 | AHAP `milestone` | §2.1 |
| 860 | konfety: **24** proužků 2×10 pt; barvy `plate*` a `muted`, **max 3** `accent`; na akcentové ploše stage-up `onAccent` + `raised` | §4.2.1 |
| 1260 | závěrečné údery | AHAP |
| 1300 | titulek „Sekce hotová“ | `motion.enter` |
| 1600 | CTA | `motion.reveal` |

#### 4.2.1 Implementace konfet
- **Jeden sdílený `progress`** (0→1, 2500 ms, bezier 0.3,0,0.7,1) pro všechny kusy.
- Parametry kusů (start x, drift ±20 pt, fáze sinu, rychlost rotace, barva) **předpočítané** při mountu v `useMemo` s pevným seedem; worklet jen interpoluje z `progress`.
- Opacita 1→0 v posledních 16 % progresu. Padají, nevybuchují. Jediný částicový systém v appce (jiskry plamene zrušeny).

### 4.3 Úroveň (c): nový rekord / první stojka

| t (ms) | Co | Haptika / zvuk |
|---|---|---|
| 0 | dopad; `scrimDeep`; rozkmit a žár doběhnou 4× pomaleji (delší `duration`); opička zamrzne | heavy, pak 600 ms ticha |
| 600 | kotouč scale 1→2.4 `spring.kotouc`, ring 100 % a rozšíření 1→1.6 s opacitou 1→0 za 900 ms | úder gongu + dozvuk / `gong` (zkrácený ~1.8 s) |
| 800 | „Nový rekord“ / „První stojka“ | – |
| 1000 | opička `celebrate` (paže nahoru, bez poskoku), hrana šálu fade 200 ms | – |
| 1100 | +XP slam + count-up, ticky jako (a) | selection max 8 |
| 1800 | CTA | – |

Bez konfet.

### 4.4 Implementační poznámky

- **Jedna časová osa**: `celebration.a/b/c` v `lib/motion.ts` (`ring`, `center`, `xp`, `seriesPlate`, `pose`, `title`, `tomorrow`, `cta`).
- Úroveň vybírá čistá funkce `logic/celebrationTier.ts` (`'lesson' | 'milestone' | 'record'`) z výsledku lekce (boss). Motion ji jen čte.
- **Sync ±1 snímek** (cíl 16 ms, max 33 ms). Zdroj pravdy je sdílený čas scény na UI vlákně. Každý krok s haptikou nebo zvukem se spouští z UI vlákna `withDelay(t, …)` a v callbacku `scheduleOnRN(feedbackStep, id)`; vizuál téhož kroku startuje ze stejného `withDelay`. **Žádný `setTimeout`** pro scénu. AHAP aproximace v Expo Go: kroky APPROX jsou plánovány stejně (UI vlákno → `scheduleOnRN`), ne JS timery.
- **`skipToEnd()` je idempotentní** (flag `ended`): zruší všechny `withDelay` (`cancelAnimation` + nastavení finálních hodnot `withTiming(final, {duration: 150})`), zruší aktivní haptický vzor (`stopPattern()`), zastaví zvuky scény, vrátí ducking, ukáže CTA. Druhé volání nedělá nic. Volá se při: tapu kamkoli, `AppState` → `background`, a když pád kotoučů skončí s `finished === false` (přerušená animace). Žádná haptika za přeskočení.
- Cleanup při unmountu volá totéž co `skipToEnd()` (bez vizuálu).

---

## 5. Stavový automat maskota

### 5.1 Stavy (MVP)

| Stav | `Mood` | Vizuál | Pohyb |
|---|---|---|---|
| Neutrální | `idle` | oči otevřené, paže dole | dech 1.0→1.015 / 3 s, mrkání 4–7 s (dech vypnut, když sedí na uzlu, §3.1) |
| Slavící | `celebrate` | paže nahoru, úsměv, jantarová hrana šálu | bez poskoku; póza `moodShift`, hrana šálu fade 200 ms |
| Smutný | `sad` | uši dolů, pohled dolů | `moodShift` 300 ms, pomalý dech; **bez haptiky** |

`Mood` v `types/common.ts` zůstává pro MVP `'idle' | 'celebrate' | 'sad'` (plus stávající hodnoty, pokud existují; nové se nepřidávají).

### 5.2 Přechody
- Póza vždy `motion.moodShift` 300 ms timing, bez pružiny a bez skoku.
- **`sad` → `idle`**: jeden `moodShift` 300 ms (uši a pohled interpolují souběžně), žádný mezistav.
- Událost (lekce) má přednost před odvozeným stavem; po `eventHoldMs` 2500 (celebrate) se vrací na odvozený.

### 5.3 Výpočet `logic/mascotMood.ts` (návrh rozhraní, píše boss)

```ts
export type MascotEvent = 'lessonComplete' | 'record' | 'streakLost' | null;
export type MascotInput = { streakLostToday: boolean; event: MascotEvent };

export function mascotMood(i: MascotInput): Mood {
  if (i.event === 'lessonComplete' || i.event === 'record') return 'celebrate';
  if (i.event === 'streakLost' || i.streakLostToday) return 'sad';
  return 'idle';
}
```

### 5.4 Později
- `curious`, `focused`, `sleeping`. **`sleeping` nikdy podle denní hodiny**, jen po dlouhé nečinnosti (návrh: > 48 h od poslední aktivity).
- Oči sledující prst na Profilu.
- Rive maskot (dev build).

### 5.5 Formát assetů
Teď SVG (react-native-svg) + Reanimated: šál jako `<G>` s kotvou u krku, jantarová hrana šálu jako samostatná vrstva s opacitou, víčka jako `<Path>` pro scaleY. Rive později, rozhraní `<Mascot mood />` se nemění.

---

## 6. Zvukový design

### 6.1 Seznam

| ID | Délka | Spouštěč | Charakter | Zdroj |
|---|---|---|---|---|
| `tick` | ~40 ms | odpočet, XP ticky, kotouč série, liga | suchý dřevěný klik | Kenney CC0, zkrátit |
| `select` | ~60 ms | (rezerva) | tlumený klik | existuje `select.wav` |
| `plate` | 300 ms | dopad kotouče, konec výdrže, potvrzení | kov na kov | existuje `plate-snap.wav` |
| `unlock` | ~400 ms | odemčení uzlu | měkký kovový bong | existuje `unlock.wav` |
| `ring` | ~900 ms | ring oslavy (a)(b) | suchý kovový cink, krátký dozvuk | Kenney CC0, zkrátit + fade-out |
| `gong` | ~1.8 s | rekord, stage-up | tlumený kovový úder, bez crashe | Kenney CC0, zkrátit + fade-out |

Formát WAV 44.1 kHz mono 16 bit, normalizace −14 LUFS. Zakázáno: fanfáry, coin zvuky, 8bit, hlas maskota.

### 6.2 Pravidla
1. **Tichý režim = ticho** přes `playsInSilentMode: false`. Appka přepínač sama nečte.
2. **Haptika a zvuk jsou dva nezávislé přepínače** v nastavení (`hapticsEnabled`, `soundEnabled`). Kterýkoli lze vypnout bez vlivu na druhý.
3. Hlasitost 30 %, `ring`/`gong` 25 %.
4. **Ducking**: `setAudioModeAsync({ interruptionMode: 'duckOthers' })` při vstupu do scény oslavy; návrat na `mixWithOthers` v cleanupu efektu **i** v `skipToEnd()`. Jinde vždy `mixWithOthers`.
5. **Singletony**: všechny přehrávače `createAudioPlayer` jednou při startu appky (modul `lib/sound.ts`), nikdy `useAudioPlayer` ve scéně. Přehrání = `seekTo(0)` + `play()`.
6. Max 2 zvuky současně; nový `tick` přeruší předchozí.

### 6.3 Sdílené API

```ts
// lib/feedback.ts
export type FeedbackId = 'tab' | 'cta' | 'tapLight' | 'locked' | 'unlock' | 'monkeyHop'
  | 'countdown3' | 'countdown2' | 'countdown1' | 'go' | 'holdTick' | 'holdLast' | 'holdDone'
  | 'xpTick' | 'seriesPlate' | 'wheelStep' | 'leagueRise'
  | 'lesson-complete' | 'milestone' | 'gong' | 'formError';
export function feedback(id: FeedbackId): void; // haptika (pokud hapticsEnabled) + zvuk (pokud soundEnabled), ve stejném ticku
```
`'tapLight'` = vizuální stisk sekundárního tlačítka **bez haptiky** (no-op pro haptiku, existuje kvůli jednotnému API v `PressableCta`). Oslavné vzory se spouští přes `haptics.play()` (§10.3).

---

## 7. Okrajové stavy

### 7.1 Reduce Motion (`useReducedMotion()`)

| Animace | Fallback | Haptika/zvuk |
|---|---|---|
| Dokončení lekce (a) | **jak je v kódu**: `LessonCompleteScene` hraje `motion.calmFade` (200 ms) celé scény, kotouč už sedí na ose, ring plný (fade), XP finální číslo, kotouč série už na čince, opička rovnou `celebrate`, CTA spolu se scénou | zachováno včetně AHAP |
| (b) konfety | nevykreslit | zachováno |
| (c) zpomalení | jen fade + text | zachováno |
| Dech aktivního uzlu | statický prstenec opacita 0.8 | – |
| Dech opice | vypnut; mrkání ponecháno | – |
| Přeskok opičky | crossfade na nový uzel 200 ms | soft zůstává |
| Kaskády | jedno prolnutí 200 ms | – |
| Splitflap | crossfade 150 ms | – |
| Shake zamčeného uzlu | opacita 1→0.5→1 / 240 ms | warning zůstává |
| Přesun řádku v lize | crossfade | ticky zůstávají |

### 7.2 Haptika / zvuk vypnuté
- Systémová haptika off: iOS volání ignoruje.
- Přepínač „Haptika“ off: `feedback()` vynechá haptiku, zvuk se řídí vlastním přepínačem „Zvuky“.
- Zařízení bez Taptic: `safe()` spolkne odmítnutý promise.

### 7.3 Pomalé zařízení
`perfTier` se určí **při startu appky** (model zařízení přes `expo-device`, případně krátké měření rámů na splash/první obrazovce) a uloží se do `services/settings`. Nikdy se neměří během první oslavy. Degradace pro `low`: konfety 24→12; idle smyčky jen na aktivní záložce (už platí). Haptika a časování nedegradují.

### 7.4 Přerušení
- `AppState` → `background` během oslavy: `skipToEnd()`. Po návratu konečný stav s CTA, nic se nepřehrává znovu.
- Inactive (notifikace): pokračuje.
- Výdrž v pozadí: čas z `Date.now()` (logika), haptika se nedohání.

### 7.5 Chyba uložení XP
Jen lokální stav: XP se zapisuje do persist store (`services/`); žádný síťový sync, není ve SPEC. Pokud zápis do úložiště selže: XP číslo jemné zachvění (±2 pt, 2 cykly, 200 ms), malá ikona v `muted`, **bez haptiky**; další pokus při příštím zápisu storu. Oslava se hraje vždy celá.

---

## 8. Výkon a testování

- Rozpočet 16.6 ms/rám; UI vlákno < 6 ms pro oslavu.
- Max 1 částicový systém (konfety), max 24 `Animated.View`, jeden sdílený progress, bez stínů a blur.
- Jen `transform`/`opacity`, kromě `LinearTransition` v lize.
- Testy v Expo Go: perf monitor ≥ 58 FPS (UI i JS) během (a)(b)(c); iPhone SE 2 (nebo iPhone 11 v Low Power); Reduce Motion projít §7.1; haptika naslepo rozliší (a)/(b)/(c); sync video 240 fps, **±1 snímek (max 33 ms)**; jednotkové testy `mascotMood`, `celebrationTier`, výběr XP ticků (strop 8), idempotence `skipToEnd`.

---

## 9. Prioritizace

### MVP top 10

1. Fáze 1 tokeny (`motion.cvak`, `spring.kotouc`, `spring.sal`) + `feedback(id)` + `haptics.play()` s jedním aktivním vzorem a APPROX (t=0 = dopad).
2. Vtlačení na `onPressIn` u všech tlačítek, medium jen u primárního.
3. Dokončení lekce (a): kotouč do středu, ring, XP ticky (max 8), opička `celebrate` + hrana šálu, „Zítra: …“, CTA v 1200 ms; `skipToEnd()` + AppState + ducking.
4. Nacvaknutí kotouče série na činku (§3.6).
5. Odpočet 3-2-1-0 a haptika výdrže.
6. Odemčení uzlu (obrys/litina/Lock/trim/scale) + přeskok opičky na nový uzel.
7. Zamčený uzel: warning + shake.
8. Dech aktivního uzlu (prstenec opacita + scale), opička bez vlastního dechu na uzlu.
9. Tab bar: selection + tečka Cvak; hotový uzel trim fajfky.
10. Reduce Motion fallbacky pro body 3, 4, 6.

### Později
- Úroveň (b) konfety a (c) gong (nové zvuky, ladění).
- Liga: přejetí řádku a ticky.
- Splitflap, sheet s kolečkem.
- Nálady `curious`/`focused`/`sleeping`; oči sledující prst.
- Nativní Core Haptics modul (dev build); Rive maskot.

---

## 10. Ukázkový kód

### 10.1 Tlačítko s vtlačením

Předpoklad: `motion.cvak` existuje (zavádí se ve fázi 1, §1.2); `'tapLight'` je v `FeedbackId` (§6.3).

```tsx
// components/ui/PressableCta.tsx
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { feedback } from '@/lib/feedback';
import { motion, useMotionSafe } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_DEPTH = 2;

type Props = PressableProps & { weight?: 'primary' | 'secondary' };

export function PressableCta({ weight = 'primary', onPressIn, onPressOut, style, ...rest }: Props) {
  const { reduced } = useMotionSafe();
  const y = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : y.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, a]}
      onPressIn={(e) => {
        feedback(weight === 'primary' ? 'cta' : 'tapLight');
        y.set(withTiming(PRESS_DEPTH, motion.press));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        y.set(withTiming(0, motion.cvak));
        onPressOut?.(e);
      }}
    />
  );
}
```
Barva stisku (`accentPressed` / `raisedPressed`) je věc design-agenta; zde jen pohyb.

### 10.2 XP count-up s ticky

```tsx
// components/lesson/XpCount.tsx
import { TextInput } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedReaction, useSharedValue, withDelay, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useEffect } from 'react';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { feedback } from '@/lib/feedback';

const AnimatedText = Animated.createAnimatedComponent(TextInput);
const MAX_TICKS = 8;

export function XpCount({ xp, delay }: { xp: number; delay: number }) {
  const { reduced } = useMotionSafe();
  const n = useSharedValue(reduced ? xp : 0);
  const scale = useSharedValue(reduced ? 1 : 1.2);
  const step = Math.max(5, Math.ceil(xp / MAX_TICKS / 5) * 5);

  useEffect(() => {
    if (reduced) return;
    scale.set(withDelay(delay, withSpring(1, motion.slam)));
    n.set(withDelay(delay, withTiming(xp, { duration: 650, easing: ease.out })));
  }, [xp, delay, reduced, n, scale]);

  useAnimatedReaction(
    () => Math.floor(n.value / step),
    (cur, prev) => { if (prev !== null && cur > prev) scheduleOnRN(feedback, 'xpTick'); },
  );

  const props = useAnimatedProps(() => ({ text: `+${Math.round(n.value)} XP`, defaultValue: '' }) as never);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <AnimatedText editable={false} animatedProps={props} style={style} accessibilityLabel={`+${xp} XP`} />;
}
```
**Ověřit na Fabric (RN 0.86):** že `text` přes `useAnimatedProps` na `TextInput` aktualizuje obsah. Pokud ne, **fallback**: `useAnimatedReaction` volá `scheduleOnRN(setShown, cur * step)` jen při ticku (max 8 re-renderů), poslední hodnota `xp` na konci; žádný setState 60× za sekundu.

### 10.3 `haptics.play(id)` – jeden aktivní vzor

```ts
// lib/haptics.ts (rozšíření)
type Step = [atMs: number, kind: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'selection' | 'success' | 'warning'];
export type PatternId = 'lesson-complete' | 'milestone' | 'gong' | 'league-rise' | 'unlock';

/** t=0 = dopad kotouče (heavy). Volá se v onImpact. */
export const APPROX: Record<PatternId, Step[]> = {
  'lesson-complete': [[0, 'heavy'], [80, 'rigid'], [160, 'soft'], [320, 'soft'], [480, 'light'], [620, 'light'], [760, 'medium'], [1250, 'success']],
  milestone: [[0, 'heavy'], [80, 'rigid'], [200, 'soft'], [360, 'soft'], [520, 'light'], [680, 'medium'], [840, 'medium'], [1260, 'heavy'], [1380, 'light'], [1460, 'success']],
  gong: [[0, 'heavy'], [600, 'heavy'], [640, 'heavy'], [800, 'medium'], [1050, 'soft'], [1400, 'soft'], [1900, 'soft']],
  'league-rise': [[0, 'light'], [110, 'light'], [220, 'rigid']],
  unlock: [[0, 'rigid'], [90, 'soft']],
};

let native: { playAhap(id: PatternId): () => void } | null = null;
export const registerNativeHaptics = (m: typeof native) => { native = m; };

let active: (() => void) | null = null;

/** Drží jediný aktivní vzor: nové volání zruší předchozí. `schedule` dodává scéna (UI vlákno → scheduleOnRN). */
export function play(id: PatternId, schedule: (steps: Step[]) => () => void): () => void {
  stopPattern();
  const stop = native ? native.playAhap(id) : schedule(APPROX[id]);
  active = stop;
  return stopPattern;
}

export function stopPattern() {
  if (active) { const s = active; active = null; s(); }
}
```
`schedule` ve scéně: pro každý krok `withDelay(at, withTiming(…, cb → scheduleOnRN(fireIfEnabled, kind)))` na sdíleném shared value; vrácená funkce zavolá `cancelAnimation`. Volání: v `onImpact` `play(tierPattern, schedule)`; `skipToEnd()` volá `stopPattern()`.

---

## 11. Odchylky od zadání a kompromisy

| Zadání | Realita | Proč |
|---|---|---|
| SwiftUI / Core Haptics | RN + Reanimated; AHAP soubory + APPROX v Expo Go | Expo Go neumí nativní moduly |
| Spojité haptické křivky | v Expo Go řada transientů | expo-haptics nemá continuous |
| Rive/Lottie maskot | SVG + Reanimated | Expo Go, nulová závislost |
| Pružina na tlačítkách | jen timing Cvak | prémiový tón |
| Streak jako plamen | činka plná kotoučů | rozhodnutí uživatele |
| CTA oslavy | 1200 ms (dnes 1000) | ring + XP; zeštíhleno rozhodnutím bosse |
| `motion.seat` ζ 0.55 | jediná výjimka z ζ ≥ 0.6 | zaboření kotouče je záměr, prošlo QA |
| Zvuky `ring`, `gong`, `tick` | Kenney CC0, zkrácené | do dodání fallback `plate` + `unlock` |

## 12. Otevřené otázky
1. Které konkrétní soubory Kenney CC0 pro `tick`/`ring`/`gong` (kdo vybere a ořízne: boss nebo motion s přístupem k assetům).
2. Text řádku „Zítra: …“ a zdroj dat (boss, logika).
3. `perfTier` heuristika: seznam modelů vs. měření rámů na startu – rozhodnutí bosse.
4. Výsledek ověření `useAnimatedProps` + `TextInput` na Fabric (qa), jinak fallback §10.2.
5. Přesné tokeny barev konfet `plate*` (které odstíny) – design-agent.
