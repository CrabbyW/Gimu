import type { MilestoneUnit } from '@/types';

/** Česká množná čísla: 1 → one, 2–4 → few, jinak many (stačí pro UI appky). */
export const czPlural = (n: number, one: string, few: string, many: string): string =>
  (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

const MILESTONE_UNIT_SHORT = { reps: '×', seconds: 's', kg: 'kg' } as const;

export const copy = {
  common: {
    continue: 'Pokračovat', back: 'Zpět', done: 'Hotovo', start: 'Start', pause: 'Pauza',
    resume: 'Pokračovat', retry: 'Zkusit znovu', loading: 'Načítám',
    loadError: (what: string) => `Nepodařilo se načíst ${what}.`,
    // Předmět věty „Nepodařilo se načíst …“ (4. pád).
    loadTarget: { profile: 'profil', path: 'cestu', lesson: 'lekci', lessonResult: 'výsledek lekce' },
  },
  tabs: { training: 'Trénink', league: 'Liga', progress: 'Progres', season: 'Sezóna', profile: 'Profil' },
  onboarding: {
    stepLabel: (n: number, total: number) => `KROK ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    // Měřicí linka onboardingu (R42): štítek, pozice „02/05“ a hlasitý popis.
    stepKey: 'KROK',
    // Mono štítek vybrané karty volby (Nothing Dot: výběr = hrana `text` + štítek, ne výplň).
    selected: 'Vybráno',
    stepValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    stepA11y: (n: number, total: number) => `Krok ${n} z ${total}`,
    path: { title: 'Vyber si cestu', lead: 'Cestu můžeš později změnit. Opice půjde s\u00A0tebou.' },
    dream: {
      title: 'Jaké tělo chceš?', lead: 'Vyber jednu vizi. Uvidíš ji nahoře v Progresu.',
      placeholder: 'Chci udělat muscle-up a mít viditelný sixpack.',
      counter: (n: number, max: number) => `${n} / ${max}`,
      counterA11y: (n: number, max: number) => `${n} z ${max} znaků`,
      customTitle: 'Vlastní…', customLine: 'Napiš si ji po svém.', customField: 'Tvoje vize',
      // Titulek karty se ukládá jako `dreamBody` (R36), proto věcný a krátký.
      options: {
        muscleUp: { title: 'Muscle-up', line: 'Přes hrazdu čistě, bez kopání.' },
        vTaper: { title: 'V-tvar', line: 'Široká záda, úzký pas.' },
        explosive: { title: 'Výbušnost', line: 'Síla, která přijde v jednom rázu.' },
        pullStrength: { title: 'Síla v tahu', line: 'Shyby v sériích, ne po jednom.' },
        lean: { title: 'Suchá postava', line: 'Málo tuku, každý sval vidět.' },
        athlete: { title: 'Atlet', line: 'Rychlý, pružný, připravený.' },
        handstand: { title: 'Volná stojka', line: 'Na rukou bez zdi a bez strachu.' },
        lightStrong: { title: 'Lehké a silné tělo', line: 'Vlastní váhu uneseš kamkoli.' },
        core: { title: 'Pevný střed', line: 'Břicho, které podrží L-sit.' },
        mobility: { title: 'Mobilita', line: 'Hluboký dřep, volná ramena.' },
        planche: { title: 'Planche', line: 'Tělo ve vzduchu, rovné jak prkno.' },
        gymnast: { title: 'Gymnasta', line: 'Kontrola v každém pohybu.' },
        rawStrength: { title: 'Hrubá síla', line: 'Dipy a shyby se zátěží.' },
        mass: { title: 'Objem', line: 'Plný hrudník, paže a záda.' },
        legs: { title: 'Nohy z oceli', line: 'Pistol squat na obě nohy.' },
        shoulders: { title: 'Kulatá ramena', line: 'Ramena, co napnou každé triko.' },
        grip: { title: 'Železný úchop', line: 'Na hrazdě vydržíš nejdéle.' },
        durable: { title: 'Nezlomný', line: 'Vydrží dřinu i roky tréninku.' },
      },
    },
    milestones: {
      title: 'První milníky', lead: 'Vyber 2 až 3. Můžeš napsat i\u00A0vlastní.', addCustom: 'Vlastní milník', customLabel: 'Název', customTarget: 'Cíl',
      customPlaceholder: 'Stojka bez zdi', customUnit: 'Jednotka', customSubmit: 'Přidat milník', customCancel: 'Zrušit',
      customTargetError: 'Zadej celé číslo od 1 do 9999.',
      units: { reps: 'Počet', seconds: 'Sekundy', kg: 'kg', done: 'Splněno' },
      // Jednotka u pole Cíl a v chipu; „splněno“ cíl nemá.
      unitShort: MILESTONE_UNIT_SHORT,
      targetPlaceholder: { reps: '15', seconds: '30', kg: '5' },
      // Popisek chipu vlastního milníku: „Shyby 15×“, „Stojka 30 s“, „Salto“.
      customChip: (label: string, target: number, unit: MilestoneUnit) => {
        if (unit === 'done') return label;
        // Opakování se píšou „15×“ bez mezery, ostatní jednotky s mezerou („30 s“, „5 kg“).
        const amount = unit === 'reps' ? `${target}${MILESTONE_UNIT_SHORT.reps}` : `${target} ${MILESTONE_UNIT_SHORT[unit]}`;
        return `${label} ${amount}`;
      },
      pickCount: (n: number, max: number) => `${n} / ${max} vybráno`,
    },
    weight: {
      title: 'Cíl váhy', lead: 'Volitelné. Graf váhy uvidíš jen s\u00A0cílem.', lose: 'Hubnutí', gain: 'Nabírání', none: 'Neřeším',
      current: 'Aktuální váha', target: 'Cílová váha', unit: 'kg',
      errors: { invalid: 'Zadej číslo mezi 30 a\u00A0250 kg.', loseDirection: 'Při hubnutí musí být cíl nižší než aktuální váha.', gainDirection: 'Při nabírání musí být cíl vyšší než aktuální váha.' },
    },
    // Teplá litina §3.7: poslední krok před zrozením opice.
    reminder: {
      title: 'Kdy ti máme připomenout lekci?', lead: 'Jedna zpráva denně, jen když ještě nemáš hotovo.',
      timeLabel: 'Čas připomínky', change: 'Změnit čas', skip: 'Bez připomínky',
      timeA11y: (time: string) => `Čas připomínky ${time}. Klepni pro změnu.`,
    },
    birth: {
      title: 'Tohle je tvoje opice.', lead: 'Poroste s\u00A0každou lekcí.', cta: 'Jdeme trénovat', bornLabel: (date: string) => `NAROZENA ${date}`,
      saveError: 'Opici se nepodařilo uložit. Zkus to znovu.',
    },
  },
  map: {
    sectionLabel: (n: number, title: string) => `SEKCE ${String(n).padStart(2, '0')} · ${title.toUpperCase()}`,
    start: 'Začít', replay: 'Zopakovat', locked: 'Nejdřív dokonči předchozí lekci.',
    exercises: (n: number) => (n >= 5 ? `${n} cviků` : `${n} cviky`), streak: 'STREAK', xp: 'XP', days: 'dní',
    // Řádek v popoveru uzlu: „10 KG · 4 CVIKY · +20 XP“ (velká písmena dělá mono štítek).
    nodeMeta: (kg: number, exercises: string, xp: number) => `${kg} kg · ${exercises} · +${xp} XP`,
    boss: 'BOSS', closePopover: 'Zavřít detail lekce',
    nodeState: { locked: 'zamčená', current: 'aktuální', done: 'dokončená' },
    nodeA11y: (order: number, title: string, kg: number, state: string) => `Lekce ${order}, ${title}, ${kg} kilogramů, ${state}`,
    league: (tier: string) => `LIGA · ${tier}`,
    streakA11y: (n: number) => `Streak ${n} dní`,
    xpA11y: (n: number) => `${n} XP celkem`,
    leagueA11y: (tier: string) => `Liga ${tier}`,
    // Telemetrický pruh a měřicí linka v hlavičce mapy (R42).
    tier: 'LIGA',
    sectionProgress: (done: number, total: number) => `${String(done).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    // Teplá litina §3.1: popisky uzlů z dat (počet cviků, odhad minut, XP).
    startLesson: 'Začít lekci', replayLesson: 'Zopakovat lekci',
    nodeInfo: (exercises: number, minutes: number) => `${exercises} ${czPlural(exercises, 'cvik', 'cviky', 'cviků')} · ${minutes} min`,
    xpGain: (xp: number) => `+${xp} XP`,
    xpTotal: (xp: number) => `${xp} XP`,
    bossTitle: 'Boss sekce',
    bossUnlock: (n: number) => `Odemkne se po ${n} ${czPlural(n, 'lekci', 'lekcích', 'lekcích')}`,
    firstTitle: (min: number) => `První lekce: ${min} ${czPlural(min, 'minuta', 'minuty', 'minut')}`,
    firstBody: (xp: number) => `Za dokončení dostaneš kotouč na činku a +${xp} XP.`,
    // Hloubka a materiál (2026-10-03): ražba na kotouči a hero hlavička sekce nad mapou („3 / 8“).
    plateUnit: 'KG',
    sectionKicker: (n: number) => `SEKCE ${String(n).padStart(2, '0')}`,
    sectionTotal: (total: number) => `/ ${total}`,
    sectionCaption: (total: number) => `${czPlural(total, 'lekce', 'lekcí', 'lekcí')} hotovo`,
    brokenTitle: 'Série se přerušila',
    brokenBody: (n: number) => `Nejdelší série ${n} ${czPlural(n, 'den', 'dny', 'dní')} zůstává v profilu. Jedna lekce rozjede novou.`,
    sectionProgressA11y: (n: number, title: string, done: number, total: number) => `Sekce ${n}, ${title}: hotovo ${done} z ${total} lekcí`,
  },
  // StreakBarbell a pilulka série (Teplá litina §2.7). Plamen se nepoužívá.
  streak: {
    days: (n: number) => czPlural(n, 'den', 'dny', 'dní'),
    a11yDone: (n: number) => `Série ${n} ${czPlural(n, 'den', 'dny', 'dní')}, dnes hotovo`,
    a11yPending: (n: number) => `Série ${n} ${czPlural(n, 'den', 'dny', 'dní')}, dnes čeká`,
    none: 'Žádná série',
    overflow: (k: number) => `×${k}`,
    longest: (n: number) => `Nejdelší série: ${n} ${czPlural(n, 'den', 'dny', 'dní')}`,
  },
  today: { done: 'Dnes hotovo', pending: 'Dnes čeká' },
  wheel: { save: 'Uložit', close: 'Zavřít výběr' },
  legend: { done: 'Odcvičeno', caught: 'Dohnáno', missed: 'Zmeškáno', today: 'Dnes' },
  badgeTile: {
    earnedA11y: (name: string) => `Odznak ${name}, získaný`,
    lockedA11y: (name: string, condition: string) => `Odznak ${name}, zamčený. Podmínka: ${condition}`,
  },
  header: { settings: 'Nastavení' },
  lesson: {
    // Oddělovač „·“ místo dvojtečky: název bosse už dvojtečku nese („Boss: Plná osa“).
    tomorrow: (title: string, minutes: number) => `Zítra · ${title} · ${minutes} min`,
    sectionDone: 'Sekce hotová. Další se odemkne v mapě.',
    skip: 'Přeskočit',
    /** Navýšení cviku z dluhu přeskočených cviků (R44). */
    extra: (n: number, hold: boolean) => (hold ? `+${n} s za přeskočené cviky` : `+${n} opak. za přeskočené cviky`),
    reps:'OPAKOVÁNÍ', seconds: 'SEKUND', quitTitle: 'Ukončit lekci?', quitBody: 'Progres této lekce se neuloží.',
    quitConfirm: 'Ukončit', quitCancel: 'Trénovat dál', holdReady: 'Připrav se', nextExercise: 'Další cvik',
    close: 'Ukončit lekci',
    // Měřicí linka lekce (R42): mono štítek a pozice „02/05“ (tabulární číslice).
    progressLabel: 'CVIK',
    progressValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    progressA11y: (n: number, total: number) => `Cvik ${n} z ${total}`,
    locked: 'Nejdřív dokonči předchozí lekci.', backToMap: 'Zpět na mapu',
  },
  complete: {
    title: 'Kotouč na ose.', xpLesson: 'lekce', xpBoss: 'boss', xpReplay: 'opakování', xpFirst: 'první dnes',
    xpStreak: 'streak', cta: 'Pokračovat', replayTitle: 'Opakování dělá mistra.',
  },
  leagueTier: 'LIGA',
  league: {
    // Teplá litina §3.2: zamčená liga (žádná lekce v historii) a výzva mimo postupovou zónu.
    lockedTitle: 'Liga se odemkne po první lekci',
    lockedBody: (n: number) => `Lekce ti dá XP a místo mezi ${n} lidmi na tvé úrovni.`,
    lockedCta: 'Začít první lekci',
    climb: 'Jedna lekce tě posune nahoru',
    // XP ve sloupci: tisíce oddělené nezlomitelnou mezerou („9 999“), aby se číslo nezalomilo.
    xpValue: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    me: 'Ty', promote: 'POSTUP', demote: 'SESTUP', explainer: 'XP za lekce a pravidelnost, ne za výkon.',
    endsIn: 'KONEC TÝDNE',
    result: {
      promote: (tier: string) => `Postup do ligy ${tier}.`,
      stay: (tier: string) => `Zůstáváš v lize ${tier}.`,
      demote: (tier: string) => `Sestup do ligy ${tier}. Tenhle týden to otočíš.`,
    },
    errorWhat: 'ligu',
    // Odpočet „3D 14H 22M“ (velká písmena, tabulární číslice).
    countdown: (d: number, h: number, m: number) => `${d}D ${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M`,
    countdownA11y: (d: number, h: number, m: number) => `Do konce týdne ${d} d, ${h} h, ${m} min`,
    // Teplá litina §3.2: hlavička = odznak + název ligy + tichý odpočet větou (bez telemetrie).
    headerTitle: (tier: string) => `Liga ${tier}`,
    endsInLine: (d: number, h: number, m: number) => `Týden končí za ${d} d ${h} h ${m} min`,
    xp: 'XP', rank: 'POZICE', myXp: 'TVOJE XP',
    // Pódium top 3 (hloubka a materiál): XP pod jménem, tisíce s nezlomitelnou mezerou.
    podiumXp: (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XP`,
    // Prázdný stav: uživatel má tento týden 0 XP (soupeři už mohou mít).
    podiumEmpty: 'Nový týden, nikdo zatím nemá XP. Pódium obsadí první tři, kdo odcvičí lekci.',
    emptyWeek: 'Tenhle týden zatím bez XP. Jedna lekce tě posune nahoru.',
    lastWeek: (rank: number) => `MINULÝ TÝDEN · ${rank}. MÍSTO`,
    // Telemetrie karty výsledku (R42): „MINULÝ TÝDEN: 3. MÍSTO“.
    lastWeekKey: 'MINULÝ TÝDEN', placeUnit: 'MÍSTO',
    lastWeekA11y: (rank: number) => `Minulý týden ${rank}. místo`,
    dismiss: 'Rozumím',
    rowA11y: (rank: number, name: string, xp: number) => `${rank}. místo, ${name}, ${xp} XP`,
    // Nothing Dot fáze 2: stavový řádek („LIGA BRONZ“ · „● 6 D 2 H“, nezlomitelné mezery), hero pozice a odznak.
    statusTier: (tier: string) => `LIGA ${String(tier).toUpperCase()}`,
    statusEnds: (d: number, h: number) => `${d} D ${h} H`,
    rankOf: (n: number) => `/ ${n}`,
    heroA11y: (rank: number, n: number) => `Tvoje pozice ${rank}. z ${n}`,
    heroXp: (xp: string) => `${xp} XP tento týden`,
    tierKicker: 'ÚROVEŇ',
    tierInitial: (tier: string) => String(tier).slice(0, 1).toUpperCase(),
    tierA11y: (tier: string, level: number, total: number) => `Liga ${tier}, úroveň ${level} ze ${total}`,
    podiumKicker: 'TOP 3 TÝDNE',
    climbCta: 'Odcvičit lekci',
  },
  progress: {
    dreamLabel: 'DREAM BODY', activityLabel: 'AKTIVITA', milestonesLabel: 'MILNÍKY', weightLabel: 'VÁHA',
    logWeight: 'Zapsat váhu tento týden', save: 'Uložit', cancel: 'Zrušit',
    targetLine: (kg: number) => `CÍL ${kg} KG`, milestoneDone: 'Splněno.', errorWhat: 'progres',
    // Pondělí až neděle, hlavička mřížky aktivity.
    weekdays: ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'],
    gridA11y: (active: number) => `Posledních 5 týdnů: ${active} ${czPlural(active, 'aktivní den', 'aktivní dny', 'aktivních dní')}`,
    activeDays: (n: number) => `${n} ${czPlural(n, 'den', 'dny', 'dní')}`,
    activeKey: 'AKTIVNÍ', todayKey: 'DNES',
    // Hero Progresu (hloubka a materiál): velké číslo aktivních dní za okno mřížky + nejdelší série.
    heroKicker: 'POSLEDNÍCH 5 TÝDNŮ',
    heroActiveUnit: (n: number) => czPlural(n, 'aktivní den', 'aktivní dny', 'aktivních dní'),
    heroLongestKey: 'NEJDELŠÍ SÉRIE',
    heroLongestValue: (n: number) => `${n} ${czPlural(n, 'den', 'dny', 'dní')}`,
    noMilestones: 'Zatím žádné milníky.',
    milestoneValue: (current: number, target: number) => `${current} / ${target}`,
    milestoneA11y: (label: string, current: number, target: number, done: boolean) =>
      `${label}, ${current} z ${target}${done ? ', splněno' : ''}. Klepni pro zápis.`,
    milestoneField: 'Aktuální hodnota', milestoneMarkDone: 'Označit jako splněné', milestoneUndo: 'Vrátit na nesplněno',
    milestoneError: 'Zadej číslo od 0 do 9999.',
    weightField: 'Váha tento týden', weightUnit: 'kg', weightError: 'Zadej číslo mezi 30 a 250 kg.',
    weightEmpty: 'Zatím bez záznamu. První zápis založí graf.',
    weightLatest: 'POSLEDNÍ ZÁPIS', weightTarget: 'CÍL',
    chartA11y: (latest: number | null, target: number) =>
      latest === null ? `Graf váhy bez záznamů, cíl ${target} kg` : `Graf váhy, poslední zápis ${latest} kg, cíl ${target} kg`,
    // Teplá litina §3.3: prázdná mřížka (jeden týden + věta), popisek týdne „29. 9.“, plné názvy dní pro čtečku.
    activityEmpty: 'Tady uvidíš každý den, kdy jsi trénoval. První tečka přibude po lekci.',
    weekShort: (d: number, m: number) => `${d}. ${m}.`,
    weekdaysShort: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
    // Binární milník (ano/ne) jako číslo 0 / 1, stejná gramatika jako číselný.
    milestoneYes: 'Ano', milestoneNo: 'Zatím ne',
    newCosmetic: 'NOVÁ KOSMETIKA', toWardrobe: 'Otevřít Šatník', dismiss: 'Zavřít',
    saveError: 'Uložení se nepovedlo. Zkus to znovu.',
    // Nothing Dot fáze 2: hero dlaždice, součet aktivity, štítek vize, hodnota váhy a krátká pilulka zápisu.
    activeTitle: 'Aktivní dny', activeSub: 'Posledních 5 týdnů',
    longestTitle: 'Nejdelší série', longestSub: 'Tvůj rekord',
    activeTally: (n: number, total: number) => `${n} / ${total}`,
    visionLabel: 'VIZE',
    weightA11y: (kg: string) => `Poslední zápis ${kg} kg`,
    logWeightCta: 'Zapsat váhu',
  },
  wardrobe: {
    title: 'Šatník',
    slots: { outfit: 'Oblečení', accessory: 'Doplněk', mapBackground: 'Mapa', lessonEffect: 'Efekt', profileFrame: 'Rám' },
    bananas: 'BANÁNŮ', buy: (p: number) => `Koupit za ${p}`, equip: 'Nasadit', unequip: 'Sundat', seasonNever: 'Už nikdy nevyjde',
    lock: {
      milestoneCompleted: (n: number) => `Splň ${n} ${czPlural(n, 'milník', 'milníky', 'milníků')}`,
      streak: (d: number) => `Streak ${d} ${czPlural(d, 'den', 'dny', 'dní')}`,
      season: (name: string) => `Odměna sezóny ${name}`,
    },
    insufficient: 'Málo banánů. Banány přibývají s XP.',
    price: (p: number) => `${p} BANÁNŮ`, owned: 'KOUPENO', equipped: 'NASAZENO', seasonUnknown: 'sezóny',
    buyConfirm: (name: string, p: number) => `Koupit ${name} za ${p} ${czPlural(p, 'banán', 'banány', 'banánů')}?`,
    buyYes: 'Koupit', cancel: 'Zrušit', close: 'Zavřít Šatník', errorWhat: 'šatník',
    actionError: 'Akce se nepovedla. Zkus to znovu.',
    empty: 'V tomhle slotu zatím nic není.',
    tileA11y: (name: string, state: string) => `${name}, ${state}`,
    state: { equipped: 'nasazeno, klepni pro sundání', unlocked: 'klepni pro nasazení', buy: 'klepni pro koupi', locked: 'zamčeno' },
    preview: 'Náhled opice s nasazenými věcmi',
    // Nothing Dot fáze 2: mono štítek zamčené položky a zůstatek banánů pro čtečku.
    locked: 'ZAMČENO',
    bananasA11y: (n: number) => `${n} ${czPlural(n, 'banán', 'banány', 'banánů')}`,
  },
  profile: {
    // Nothing Dot fáze 2: stavový řádek, dlaždice statistik a odkaz do šatníku.
    pathStatus: (name: string) => `CESTA ${String(name).toUpperCase()}`,
    xpNumber: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    xpUnit: 'XP', stageOf: (max: number) => `/ ${max}`, statStreak: 'Aktuální série',
    statLongest: 'Nejdelší série', badgeOf: (total: number) => `/ ${total}`,
    wardrobeLine: 'Oblečení, doplňky a rámy pro opici',
    xp: 'XP CELKEM', stage: 'STAGE', path: 'CESTA', streak: 'STREAK', badges: 'ODZNAKY',
    wardrobe: 'Šatník', settings: 'Nastavení', noBadges: 'Zatím žádné odznaky.',
    badgeCount: (n: number) => `${n} ${czPlural(n, 'odznak', 'odznaky', 'odznaků')}`,
    days: 'D', errorWhat: 'profil',
    // Teplá litina §3.5: StatGrid, karta série a sekce odznaků.
    statXp: 'XP celkem', statStage: 'Stage', statBadges: 'Odznaky',
    xpValue: (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XP`,
    stageValue: (n: number) => `Stage ${n}`,
    badgeRatio: (earned: number, total: number) => `${earned} / ${total}`,
    badgeRatioA11y: (earned: number, total: number) => `Získáno ${earned} z ${total} odznaků`,
    streakLabel: 'Série',
    streakDays: (n: number) => `${n} ${czPlural(n, 'den', 'dny', 'dní')}`,
    pathLine: (name: string) => `Cesta: ${name}`,
  },
  notifications: {
    title: 'Opice',
    // Emoji jen v systémové notifikaci, v UI ne (spec §6.8). Platilo do Teplé litiny.
    // Teplá litina §3.7 (nahrazuje řádek níž): tichý tón, bez emoji. Při nulové sérii nabídne délku lekce, když ji volající zná.
    reminder: (n: number, minutes?: number) => (n > 0
      ? `Opice čeká na dnešní lekci. Série ${n} ${czPlural(n, 'den', 'dny', 'dní')}.`
      : typeof minutes === 'number' && Number.isFinite(minutes)
        ? `Opice čeká na dnešní lekci. Stačí ${minutes} ${czPlural(minutes, 'minuta', 'minuty', 'minut')}.`
        : 'Opice čeká na dnešní lekci.'),
  },
  settings: {
    dataSection: 'Data', reset: 'Reset app', resetLine: 'Deletes your progress and starts again from the beginning.',
    resetTitle: 'Reset app?', resetConfirm: 'All progress, XP, streak and goals will be deleted. The app starts from the beginning.',
    resetCancel: 'Cancel', resetDo: 'Reset',
    title: 'Nastavení', theme: 'Téma', themeOptions: { system: 'Systém', light: 'Světlý', dark: 'Tmavý' },
    reminder: 'Denní připomínka', hour: 'Hodina', sendTest: 'Poslat testovací notifikaci',
    denied: 'Notifikace jsou v systému vypnuté.', openSettings: 'Otevřít nastavení', dev: 'Dev menu',
    unsupported: 'Na webu notifikace nejdou. Zkus to v telefonu.', hourValue: (h: number) => `${String(h).padStart(2, '0')}:00`,
    sent: 'Odesláno.', hourDown: 'Připomínka dřív', hourUp: 'Připomínka později',
    // Motion spec §6.2: dva nezávislé přepínače.
    feedback: 'Odezva', haptics: 'Haptika', hapticsLine: 'Jemné vibrace při klepnutí a oslavě.',
    sound: 'Zvuky', soundLine: 'Krátké zvuky kotoučů a oslavy.',
    hourPick: 'Čas připomínky', appearance: 'Vzhled', reminderSection: 'Připomínka',
  },
  // Nastavení → Cíle: přehled v Nastavení a čtyři editory (milníky, váha, vize, cesta).
  goals: {
    section: 'Cíle', save: 'Uložit', cancel: 'Zrušit', close: 'Zavřít',
    rows: { milestones: 'Milníky', weight: 'Cíl váhy', dream: 'Vize těla', path: 'Cesta tréninku' },
    rowA11y: (title: string, value: string) => `${title}: ${value}. Upravit.`,
    loadError: 'Cíle se nepodařilo načíst.', noProfile: 'Profil zatím neexistuje.',
    // Váha česky s desetinnou čárkou: „82,5“.
    kg: (n: number) => String(n).replace('.', ','),
    weightNone: 'Bez cíle',
    weightValue: (kind: 'lose' | 'gain', start: number, target: number) =>
      `${kind === 'lose' ? 'Hubnutí' : 'Nabírání'} · ${String(start).replace('.', ',')} → ${String(target).replace('.', ',')} kg`,
    errors: {
      milestoneCount: 'Nech si 2 až 3 milníky.',
      milestoneTarget: 'Cíl musí být celé číslo od 1 do 9999.',
      weight: 'Zkontroluj váhu. Cíl musí sedět ke směru.',
      dream: 'Vize musí mít 3 až 140 znaků.',
      path: 'Tuhle cestu neznáme. Vyber jinou.',
      unknown: 'Uložit se nepodařilo. Zkus to znovu.',
    },
    milestones: {
      title: 'Milníky', lead: 'Drž 2 až 3. Pokrok u ponechaných milníků zůstane.',
      yours: 'Tvoje milníky', add: 'Přidat milník', count: (n: number, max: number) => `${n} / ${max}`,
      progress: (current: number, target: number, unit: MilestoneUnit) => (unit === 'done'
        ? (current >= 1 ? 'Splněno' : 'Zatím nesplněno')
        : `Pokrok ${current} / ${target} ${MILESTONE_UNIT_SHORT[unit]}`),
      remove: (label: string) => `Odebrat milník ${label}`,
      minHint: 'Méně než 2 milníky mít nejde. Nejdřív jeden přidej.',
      fullHint: 'Máš 3 milníky. Nejdřív jeden odeber.',
      noPresets: 'Všechny předvolby cesty už máš. Napiš si vlastní.',
    },
    weight: { title: 'Cíl váhy', lead: 'Volitelné. Graf váhy uvidíš jen s cílem.', start: 'Výchozí váha' },
    dream: { title: 'Vize těla', lead: 'Jedna vize, kterou uvidíš nahoře v Progresu.' },
    path: {
      title: 'Cesta tréninku', lead: 'Trénuješ jednu cestu najednou. Opice jde s tebou.',
      notice: 'Mapa se přepne na novou cestu. Hotové lekce zůstanou.',
    },
  },
  dev: {
    title: 'Dev menu', demo: 'Načíst demo profil',
    dots: 'Tečky', dotState: { locked: 'Zamčený', current: 'Aktuální', done: 'Dokončený' }, reset: 'Reset appky', resetConfirm: 'Smazat všechna data? Téma zůstane.', xp: '+500 XP',
    stage: (s: number | null) => `Stage opice: ${s ?? 'auto'}`, seasonEnd: 'Skok na konec sezóny',
    streakLoss: 'Simulace ztráty streaku', resetTime: 'Reset časového posunu', now: 'TEĎ', offset: 'POSUN',
    offsetValue: (d: number, h: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d)} D ${h} H`, // nezlomitelné mezery: telemetrie se nesmí zalomit
    noSeason: 'Teď neběží sezóna, kterou by šlo přeskočit.', done: 'Hotovo',
  },
  season: {
    errorWhat: 'sezónu', close: 'Zavřít',
    none: 'Teď neběží žádná sezóna.',
    noneBody: 'Lekce se mezitím dál počítají do ligy i do streaku.',
    // Hlavička: „28. 9. – 26. 12.“ (data skládá obrazovka z čísel).
    dateShort: (d: number, m: number) => `${d}. ${m}.`,
    range: (from: string, to: string) => `${from} – ${to}`,
    daysLeftLabel: 'DO KONCE', daysLeftCaption: 'dní do konce',
    daysLeftA11y: (n: number) => `Do konce sezóny ${n} ${czPlural(n, 'den', 'dny', 'dní')}`,
    ended: 'Sezóna skončila.', endedBody: 'Spočítali jsme, co jsi za ni odmakal.',
    lockIn: 'Lock in', lockInBody: 'Vyber si jeden cíl na celou sezónu.', lockInCta: 'Nastavit cíl',
    goalLabel: 'CÍL SEZÓNY',
    goalKinds: { activeDays: 'Dny bez vynechání', lessons: 'Počet lekcí', milestone: 'Milník', weight: 'Váha' },
    goalKindLines: {
      activeDays: 'Kolik dní odcvičíš.', lessons: 'Kolik lekcí dáš.',
      milestone: 'Jeden cvik, víc opakování.', weight: 'Kolik kg shodíš nebo nabereš.',
    },
    // Jednotky velkého Statu progresu (verzálky jako ostatní jednotky v hlavičkách).
    units: { activeDays: 'DNÍ', lessons: 'LEKCÍ', reps: 'OPAKOVÁNÍ', seconds: 'SEKUND', weight: 'KG' },
    progressOf: (target: string, unit: string) => `/ ${target} ${unit}`,
    progressA11y: (value: string, target: string, unit: string) => `${value} z ${target} ${unit}`,
    met: 'Cíl splněn. Odměnu převezmeš na konci sezóny.',
    gridLabel: 'DNY SEZÓNY',
    legend: { active: 'ODCVIČENO', repaired: 'DOHNÁNO', missed: 'ZMEŠKÁNO', today: 'DNES' },
    gridA11y: (done: number, total: number) => `Odcvičeno ${done} z ${total} dní sezóny`,
    record: 'Zapsat hodnotu', recordField: 'Aktuální hodnota', recordSave: 'Uložit', recordCancel: 'Zrušit',
    recordError: 'Zadej celé číslo od 0.',
    comebackTitle: 'Dohnat to jde',
    comebackBody: (n: number) => `Zameškaný den opravíš druhou lekcí dne. V okně: ${n} ${czPlural(n, 'den', 'dny', 'dní')}.`,
    comebackEmpty: 'Nic k dohnání.',
    comebackWindow: 'OKNO',
    // Cíl už nejde stihnout. Nikdy „prohráno“ (spec §7.7): recap počítá každou lekci.
    unreachable: 'Celý cíl už v této sezóně nestihneš. Každá lekce se ale počítá do recapu.',
    rewardTitle: 'Odměna', rewardItem: (season: string) => `Šála ${season} a odznak`, rewardNever: 'Už nikdy nevyjde',
    recapCta: 'Tvůj recap', claimedNote: 'Odměna převzata.',
    // Modal cíle.
    goalTitle: 'Cíl sezóny', goalLead: 'Jeden cíl na celou sezónu. Změnit ho jde do jejího konce.',
    goalValue: { activeDays: 'Počet dní', lessons: 'Počet lekcí', weight: 'Změna váhy' },
    weightDir: { down: 'Shodit', up: 'Nabrat' },
    milestonePick: 'Milník', milestoneCustom: 'Vlastní milník',
    milestoneName: 'Název', milestoneTarget: 'Cíl', milestoneCurrent: 'Teď zvládneš',
    milestoneUnit: { reps: 'Opakování', seconds: 'Sekundy' },
    milestoneChip: (label: string, target: number, unit: 'reps' | 'seconds') => `${label} ${unit === 'reps' ? `${target}×` : `${target} s`}`,
    goalErrors: {
      daysRange: 'Zadej počet dní od 1 do 90.',
      countRange: 'Zadej počet lekcí od 1 do 500.',
      targetRange: 'Cíl musí být celé číslo od 1 do 1000, aktuální hodnota od 0.',
      deltaRange: 'Zadej změnu od 0,1 do 30 kg.',
    },
    // Nothing Dot fáze 2: hero odpočtu a prstenec postupu, součet dní, zamčená odměna.
    daysLeftKicker: 'DNÍ DO KONCE', endedKicker: 'KONEC SEZÓNY',
    elapsedKicker: 'UPLYNULO',
    elapsedPct: (pct: number) => `${pct} %`,
    elapsedA11y: (pct: number) => `Uplynulo ${pct} % sezóny`,
    gridTally: (done: number, total: number) => `${done} / ${total}`,
    rewardLocked: 'ODMĚNA · ZAMČENO', selected: 'VYBRÁNO',
    nameMissing: 'Milník potřebuje název.',
    saveError: 'Cíl se nepodařilo uložit. Zkus to znovu.',
  },
  recap: {
    beforeAfter: 'PŘED A PO', lessons: 'LEKCÍ', streak: 'NEJDELŠÍ STREAK', growth: 'RŮST OPICE', reward: 'ODMĚNA',
    rewardEarned: 'Šála Winter Arc je tvoje.', rewardMissed: 'Tentokrát bez šály. Odznak účasti máš.',
    share: 'Sdílet', shareSoon: 'Sdílení přijde brzy.', claim: 'Převzít odměnu', claimed: 'Převzato',
    claimError: 'Odměnu se nepodařilo převzít. Zkus to znovu.',
    labels: { weight: 'Váha', activeDays: 'Aktivní dny', lessons: 'Lekce' },
    before: 'PŘED', after: 'PO',
    // Nothing Dot fáze 2: mono řádek „PŘED 12 OPAKOVÁNÍ“ (nezlomitelné mezery uvnitř položky).
    beforeAfterValue: (key: string, value: string, unit: string) => `${key} ${value} ${unit}`,
    units: { kg: 'kg', reps: 'opakování', seconds: 'sekund', days: 'dní', lessons: 'lekcí' },
    lessonsLine: 'Za celou sezónu. Každá z nich posunula opici.',
    streakUnit: (n: number) => czPlural(n, 'den', 'dny', 'dní'),
    streakLine: 'Tolik dní v řadě bez vynechání.',
    growthLine: (from: string, to: string) => `${from} → ${to}`,
    growthSame: 'Opice drží formu. Další stage čeká v příští sezóně.',
    progressLabel: 'RECAP',
    progressValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    progressA11y: (n: number, total: number) => `Snímek ${n} z ${total}`,
    close: 'Zavřít recap', prev: 'Předchozí snímek', next: 'Další snímek', errorWhat: 'recap',
  },
  stageUp: {
    names: { 1: 'BABY', 2: 'TEENAGER', 3: 'ALPHA' },
    label: (n: number, name: string) => `STAGE ${String(n).padStart(2, '0')} · ${name}`,
    title: 'Opice roste.', cta: 'Pokračovat',
    a11y: (n: number, name: string) => `Opice vyrostla. Stage ${n}, ${name}.`,
  },
  // Nothing Dot: tečkové prvky a nové primitivy (stavový řádek, hero dlaždice mapy).
  dots: {
    plateA11y: (kg: number, state: string) => `Kotouč ${kg} kg, ${state}`,
  },
  status: {
    // Pravá strana stavového řádku mapy: živý údaj série („12 DNÍ“), tečka bliká, dokud dnes nic nebylo.
    streak: (n: number) => `${n} ${czPlural(n, 'den', 'dny', 'dní')}`.toUpperCase(),
    streakA11y: (n: number, todayDone: boolean) => `Série ${n} ${czPlural(n, 'den', 'dny', 'dní')}, ${todayDone ? 'dnes hotovo' : 'dnes čeká'}`,
  },
  hero: {
    name: 'Lekce v sekci',
    next: (title: string) => `Další: ${title}`,
    allDone: 'Sekce hotová',
  },
  mascot: {
    // Popisek pro čtečku obrazovky podle nálady.
    label: { idle: 'Tvoje opice', happy: 'Tvoje opice má radost', celebrate: 'Tvoje opice slaví', sad: 'Tvoje opice je smutná' },
    // Reaktivní opička (fáze 3): co s ní jde dělat.
    playHint: 'Ťukni a poskočí, třikrát rychle a udělá salto, podrž a pohladíš ji',
  },
} as const;
