import type { MilestoneUnit } from '@/types';

/** Anglická množná čísla: 1 → one, jinak other (stačí pro UI appky). */
export const plural = (n: number, one: string, other: string): string => (n === 1 ? one : other);

/** Násobek dávky: max. 2 desetinná místa bez koncových nul. */
const factor = (v: number) => String(Math.round(Number(v) * 100) / 100);
/** Číslo a jednotka (s, kg, ×, reps) drží na jednom řádku: běžnou mezeru za číslicí nahradí NBSP. */
export const keepUnits = (s: string) => s.replace(/(\d) (?=(s|kg|reps|min)\b)/g, '$1 ');
const MILESTONE_UNIT_SHORT = { reps: '×', seconds: 's', kg: 'kg' } as const;
// Tisíce oddělené nezlomitelnou mezerou („9 999“), aby se číslo nezalomilo.
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const days = (n: number) => `${n} ${plural(n, 'day', 'days')}`;

export const copy = {
  // Intro při studeném startu (logo moment): celé jako jeden a11y prvek, ťuknutí přeskočí.
  intro: { label: 'Opice', hint: 'Tap to skip the intro' },
  common: {
    continue: 'Continue', back: 'Back', done: 'Done', start: 'Start', pause: 'Pause',
    resume: 'Resume', retry: 'Try again', loading: 'Loading',
    loadError: (what: string) => `Couldn’t load ${what}.`,
    // Předmět věty „Couldn’t load …“.
    loadTarget: { profile: 'your profile', path: 'your path', lesson: 'the lesson', lessonResult: 'the lesson result' },
    // StateView (elite fáze 4): druhá věta chyby říká, co udělat; postup je uložený v zařízení, nic se neztratilo.
    loadErrorHint: 'Your progress is safe on this phone. Try again in a moment.',
    errorMascotA11y: 'The monkey looks puzzled',
  },
  tabs: { training: 'Train', league: 'League', progress: 'Progress', season: 'Season', profile: 'Profile' },
  onboarding: {
    stepLabel: (n: number, total: number) => `STEP ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    // Měřicí linka onboardingu (R42): štítek, pozice „02/05“ a hlasitý popis.
    stepKey: 'STEP',
    // Mono štítek vybrané karty volby (Nothing Dot: výběr = hrana `text` + štítek, ne výplň).
    selected: 'Selected',
    stepValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    stepA11y: (n: number, total: number) => `Step ${n} of ${total}`,
    path: { title: 'Pick your path', lead: 'You can change it later. The monkey comes with you.' },
    dream: {
      title: 'What body do you want?', lead: 'Pick one vision. You’ll see it at the top of Progress.',
      placeholder: 'I want a muscle-up and a visible six-pack.',
      counter: (n: number, max: number) => `${n} / ${max}`,
      counterA11y: (n: number, max: number) => `${n} of ${max} characters`,
      customTitle: 'Custom…', customLine: 'Write it your way.', customField: 'Your vision',
      // Titulek karty se ukládá jako `dreamBody` (R36), proto věcný a krátký.
      options: {
        muscleUp: { title: 'Muscle-up', line: 'Clean over the bar, no kipping.' },
        vTaper: { title: 'V-taper', line: 'Wide back, narrow waist.' },
        explosive: { title: 'Explosive', line: 'Power that hits all at once.' },
        pullStrength: { title: 'Pulling power', line: 'Pull-ups in sets, not singles.' },
        lean: { title: 'Lean build', line: 'Low fat, every muscle on show.' },
        athlete: { title: 'Athlete', line: 'Fast, springy, ready.' },
        handstand: { title: 'Free handstand', line: 'On your hands, no wall, no fear.' },
        lightStrong: { title: 'Light and strong', line: 'Carry your own weight anywhere.' },
        core: { title: 'Solid core', line: 'Abs that hold an L-sit.' },
        mobility: { title: 'Mobility', line: 'Deep squat, free shoulders.' },
        planche: { title: 'Planche', line: 'Body in the air, flat as a board.' },
        gymnast: { title: 'Gymnast', line: 'Control in every move.' },
        rawStrength: { title: 'Raw strength', line: 'Weighted dips and pull-ups.' },
        mass: { title: 'Size', line: 'Full chest, arms and back.' },
        legs: { title: 'Legs of steel', line: 'Pistol squats on both legs.' },
        shoulders: { title: 'Round shoulders', line: 'Shoulders that fill any tee.' },
        grip: { title: 'Iron grip', line: 'Last one hanging on the bar.' },
        durable: { title: 'Unbreakable', line: 'Built for years of hard work.' },
      },
    },
    milestones: {
      title: 'First milestones', lead: 'Pick 2 or 3. You can write your own too.', addCustom: 'Custom milestone', customLabel: 'Name', customTarget: 'Target',
      customPlaceholder: 'Freestanding handstand', customUnit: 'Unit', customSubmit: 'Add milestone', customCancel: 'Cancel',
      customTargetError: 'Enter a whole number from 1 to 9999.',
      units: { reps: 'Reps', seconds: 'Seconds', kg: 'kg', done: 'Done' },
      // Jednotka u pole Cíl a v chipu; „done“ cíl nemá.
      unitShort: MILESTONE_UNIT_SHORT,
      targetPlaceholder: { reps: '15', seconds: '30', kg: '5' },
      // Popisek chipu vlastního milníku: „Pull-ups 15×“, „Handstand 30 s“, „Backflip“.
      customChip: (label: string, target: number, unit: MilestoneUnit) => {
        if (unit === 'done') return label;
        // Opakování se píšou „15×“ bez mezery, ostatní jednotky s mezerou („30 s“, „5 kg“).
        const amount = unit === 'reps' ? `${target}${MILESTONE_UNIT_SHORT.reps}` : `${target} ${MILESTONE_UNIT_SHORT[unit]}`;
        return `${label} ${amount}`;
      },
      pickCount: (n: number, max: number) => `${n} / ${max} selected`,
    },
    weight: {
      title: 'Weight goal', lead: 'Optional. The weight chart only shows with a goal.', lose: 'Lose', gain: 'Gain', none: 'Skip',
      current: 'Current weight', target: 'Target weight', unit: 'kg',
      errors: { invalid: 'Enter a number between 30 and 250 kg.', loseDirection: 'To lose weight, the target must be below your current weight.', gainDirection: 'To gain weight, the target must be above your current weight.' },
    },
    // Teplá litina §3.7: poslední krok před zrozením opice.
    reminder: {
      title: 'When should we remind you?', lead: 'One message a day, only if you haven’t trained yet.',
      timeLabel: 'Reminder time', change: 'Change time', skip: 'No reminder',
      timeA11y: (time: string) => `Reminder time ${time}. Tap to change.`,
    },
    birth: {
      title: 'This is your monkey.', lead: 'It grows with every lesson.', cta: 'Let’s train', bornLabel: (date: string) => `BORN ${date}`,
      saveError: 'Couldn’t save your monkey. Try again.',
    },
  },
  map: {
    sectionLabel: (n: number, title: string) => `SECTION ${String(n).padStart(2, '0')} · ${title.toUpperCase()}`,
    start: 'Start', replay: 'Replay', locked: 'Finish the previous lesson first.',
    exercises: (n: number) => `${n} ${plural(n, 'exercise', 'exercises')}`, streak: 'STREAK', xp: 'XP', days: 'days',
    // Řádek v popoveru uzlu: „10 KG · 4 EXERCISES · +20 XP“ (velká písmena dělá mono štítek).
    nodeMeta: (kg: number, exercises: string, xp: number) => `${kg} kg · ${exercises} · +${xp} XP`,
    boss: 'BOSS', closePopover: 'Close lesson details',
    nodeState: { locked: 'locked', current: 'up next', done: 'completed' },
    // Elite fáze 4: VoiceOver ohlásí název, stav a minuty (spec §2.3).
    nodeA11y: (order: number, title: string, kg: number, state: string, minutes: number) => `Lesson ${order}, ${title}, ${state}, about ${minutes} min, ${kg} kilograms`,
    league: (tier: string) => `LEAGUE · ${tier}`,
    streakA11y: (n: number) => `Streak ${days(n)}`,
    xpA11y: (n: number) => `${n} XP total`,
    leagueA11y: (tier: string) => `${tier} league`,
    // Telemetrický pruh a měřicí linka v hlavičce mapy (R42).
    tier: 'LEAGUE',
    sectionProgress: (done: number, total: number) => `${String(done).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    // Teplá litina §3.1: popisky uzlů z dat (počet cviků, odhad minut, XP).
    startLesson: 'Start lesson', replayLesson: 'Replay lesson',
    nodeInfo: (exercises: number, minutes: number) => `${exercises} ${plural(exercises, 'exercise', 'exercises')} · ${minutes} min`,
    xpGain: (xp: number) => `+${xp} XP`,
    // Kurogane: mono řádek pod názvem uzlu (verzálky dělá typografie `telemetry`) a spodní karta startu.
    nodeWeight: (done: boolean, kg: number) => (done ? `Done · ${kg} kg` : `${kg} kg`),
    startNamed: (title: string) => `Start ${title}`,
    startMeta: (exercises: number, xp: number) => `${exercises} ${plural(exercises, 'exercise', 'exercises')} · ${xp} XP`,
    xpTotal: (xp: number) => `${xp} XP`,
    bossTitle: 'Section boss',
    bossUnlock: (n: number) => `Unlocks after ${n} ${plural(n, 'lesson', 'lessons')}`,
    firstTitle: (min: number) => `First lesson: ${min} ${plural(min, 'minute', 'minutes')}`,
    firstBody: (xp: number) => `Finish it to earn a plate for your barbell and +${xp} XP.`,
    // Hloubka a materiál (2026-10-03): ražba na kotouči a hero hlavička sekce nad mapou („3 / 8“).
    plateUnit: 'KG',
    sectionKicker: (n: number) => `SECTION ${String(n).padStart(2, '0')}`,
    sectionTotal: (total: number) => `/ ${total}`,
    sectionCaption: (total: number) => `${plural(total, 'lesson', 'lessons')} done`,
    brokenTitle: 'Your streak broke',
    brokenBody: (n: number) => `Your longest streak of ${days(n)} stays on your profile. One lesson starts a new one.`,
    sectionProgressA11y: (n: number, title: string, done: number, total: number) => `Section ${n}, ${title}: ${done} of ${total} lessons done`,
  },
  // StreakBarbell a pilulka série (Teplá litina §2.7). Plamen se nepoužívá.
  streak: {
    days: (n: number) => plural(n, 'day', 'days'),
    a11yDone: (n: number) => `Streak ${days(n)}, done today`,
    a11yPending: (n: number) => `Streak ${days(n)}, today pending`,
    none: 'No streak',
    overflow: (k: number) => `×${k}`,
    longest: (n: number) => `Longest streak: ${days(n)}`,
  },
  today: { done: 'Done today', pending: 'Today pending' },
  wheel: { save: 'Save', close: 'Close picker' },
  legend: { done: 'Trained', caught: 'Caught up', missed: 'Missed', today: 'Today' },
  badgeTile: {
    earnedA11y: (name: string) => `Badge ${name}, earned`,
    lockedA11y: (name: string, condition: string) => `Badge ${name}, locked. Requirement: ${condition}`,
  },
  header: { settings: 'Settings' },
  lesson: {
    // Oddělovač „·“ místo dvojtečky: název bosse už dvojtečku nese („Boss: Full axis“).
    tomorrow: (title: string, minutes: number) => `Tomorrow · ${title} · ${minutes} min`,
    sectionDone: 'Section done. The next one unlocks on the map.',
    skip: 'Skip',
    /** Navýšení cviku z dluhu přeskočených cviků (R44). */
    extra: (n: number, hold: boolean) => (hold ? `+${n} s for skipped exercises` : `+${n} reps for skipped exercises`),
    reps: 'REPS', seconds: 'SECONDS', quitTitle: 'Quit lesson?', quitBody: 'Progress from this lesson won’t be saved.',
    quitConfirm: 'Quit', quitCancel: 'Keep training', holdReady: 'Get ready', nextExercise: 'Next exercise',
    close: 'Quit lesson',
    // Měřicí linka lekce (R42): mono štítek a pozice „02/05“ (tabulární číslice).
    progressLabel: 'EXERCISE',
    progressValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    progressA11y: (n: number, total: number) => `Exercise ${n} of ${total}`,
    locked: 'Finish the previous lesson first.', backToMap: 'Back to map',
    // UX pass U1: řádek dalšího cviku, pauza mezi cviky. Věty sentence case, štítky verzálkami přes `label`.
    dose: (amount: number, hold: boolean) => keepUnits(hold ? `${amount} s` : `${amount} reps`),
    nextUp: (name: string, dose: string) => `Next up: ${name} · ${dose}`,
    lastOne: 'Last one',
    tipA11y: (tip: string) => `Tip: ${tip}`,
    restLabel: 'REST',
    restNextLabel: 'NEXT UP',
    restSkip: 'Skip rest',
    restExtend: '+15 s',
    restA11y: (s: number) => `Rest, ${s} seconds left`,
  },
  complete: {
    title: 'Plate on the bar.', xpLesson: 'lesson', xpBoss: 'boss', xpReplay: 'replay', xpFirst: 'first today',
    xpStreak: 'streak', cta: 'Continue', replayTitle: 'Practice makes perfect.',
    // Rekord série (elite fáze 3): mono řádek pod titulkem.
    record: (days: number) => `NEW RECORD · ${days} DAYS`,
    // UX pass U2: jedno ťuknutí po oslavě (přeskočitelné), krátké potvrzení po výběru.
    feelQuestion: 'How did it feel?',
    feel: { easy: 'Easy', right: 'Right', hard: 'Hard' },
    feelDone: { easy: 'Next lessons a bit harder', right: 'Keeping it as is', hard: 'Next lessons a bit easier' },
    // Krátká, ať se vedle [TRY AGAIN] vejde do jednoho řádku i na 320 pt.
    feelError: 'Not saved. Lesson still counts.',
    feelRetryA11y: 'Try saving how it felt again',
  },
  leagueTier: 'LEAGUE',
  league: {
    // Teplá litina §3.2: zamčená liga (žádná lekce v historii) a výzva mimo postupovou zónu.
    lockedTitle: 'The league unlocks after your first lesson',
    lockedBody: (n: number) => `A lesson earns XP and a spot among ${n} people at your level.`,
    lockedCta: 'Start first lesson',
    climb: 'One lesson moves you up',
    xpValue: (n: number) => thousands(n),
    me: 'You', promote: 'PROMOTION', demote: 'DEMOTION', explainer: 'XP for lessons and consistency, not performance.',
    endsIn: 'WEEK ENDS',
    result: {
      promote: (tier: string) => `Promoted to ${tier} league.`,
      stay: (tier: string) => `You stay in ${tier} league.`,
      demote: (tier: string) => `Dropped to ${tier} league. Turn it around this week.`,
    },
    errorWhat: 'the league',
    // Odpočet „3D 14H 22M“ (velká písmena, tabulární číslice).
    countdown: (d: number, h: number, m: number) => `${d}D ${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M`,
    countdownA11y: (d: number, h: number, m: number) => `Week ends in ${d} d, ${h} h, ${m} min`,
    // Teplá litina §3.2: hlavička = odznak + název ligy + tichý odpočet větou (bez telemetrie).
    headerTitle: (tier: string) => `${tier} league`,
    endsInLine: (d: number, h: number, m: number) => `Week ends in ${d} d ${h} h ${m} min`,
    xp: 'XP', rank: 'RANK', myXp: 'YOUR XP',
    // Pódium top 3 (hloubka a materiál): XP pod jménem, tisíce s nezlomitelnou mezerou.
    podiumXp: (n: number) => `${thousands(n)} XP`,
    // Prázdný stav: uživatel má tento týden 0 XP (soupeři už mohou mít).
    podiumEmpty: 'New week, no XP yet. The first three to train take the podium.',
    emptyWeek: 'No XP this week yet. One lesson moves you up.',
    lastWeek: (rank: number) => `LAST WEEK · #${rank}`,
    // Telemetrie karty výsledku (R42): „LAST WEEK: #3“.
    lastWeekKey: 'LAST WEEK', placeUnit: 'PLACE',
    lastWeekA11y: (rank: number) => `Last week, place ${rank}`,
    dismiss: 'Got it',
    rowA11y: (rank: number, name: string, xp: number) => `Place ${rank}, ${name}, ${xp} XP`,
    // Nothing Dot fáze 2: stavový řádek („LEAGUE BRONZE“ · „● 6 D 2 H“, nezlomitelné mezery), hero pozice a odznak.
    statusTier: (tier: string) => `LEAGUE ${String(tier).toUpperCase()}`,
    statusEnds: (d: number, h: number) => `${d} D ${h} H`,
    rankOf: (n: number) => `/ ${n}`,
    heroA11y: (rank: number, n: number) => `Your rank ${rank} of ${n}`,
    heroXp: (xp: string) => `${xp} XP this week`,
    tierKicker: 'TIER',
    tierInitial: (tier: string) => String(tier).slice(0, 1).toUpperCase(),
    tierA11y: (tier: string, level: number, total: number) => `${tier} league, tier ${level} of ${total}`,
    podiumKicker: 'TOP 3 · WEEK',
    climbCta: 'Do a lesson',
  },
  progress: {
    dreamLabel: 'DREAM BODY', activityLabel: 'ACTIVITY', milestonesLabel: 'MILESTONES', weightLabel: 'WEIGHT',
    logWeight: 'Log this week’s weight', save: 'Save', cancel: 'Cancel',
    targetLine: (kg: number) => `GOAL ${kg} KG`, milestoneDone: 'Done.', errorWhat: 'your progress',
    // Pondělí až neděle, hlavička mřížky aktivity.
    weekdays: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    gridA11y: (active: number) => `Last 5 weeks: ${active} active ${plural(active, 'day', 'days')}`,
    activeDays: (n: number) => days(n),
    activeKey: 'ACTIVE', todayKey: 'TODAY',
    // Hero Progresu (hloubka a materiál): velké číslo aktivních dní za okno mřížky + nejdelší série.
    heroKicker: 'LAST 5 WEEKS',
    heroActiveUnit: (n: number) => `active ${plural(n, 'day', 'days')}`,
    heroLongestKey: 'LONGEST STREAK',
    heroLongestValue: (n: number) => days(n),
    noMilestones: 'No milestones yet.',
    milestoneValue: (current: number, target: number) => `${current} / ${target}`,
    milestoneA11y: (label: string, current: number, target: number, done: boolean) =>
      `${label}, ${current} of ${target}${done ? ', done' : ''}. Tap to log.`,
    milestoneField: 'Current value', milestoneMarkDone: 'Mark as done', milestoneUndo: 'Mark as not done',
    milestoneError: 'Enter a number from 0 to 9999.',
    weightField: 'Weight this week', weightUnit: 'kg', weightError: 'Enter a number between 30 and 250 kg.',
    weightEmpty: 'No entries yet. Your first one starts the chart.',
    weightLatest: 'LATEST', weightTarget: 'GOAL',
    chartA11y: (latest: number | null, target: number) =>
      latest === null ? `Weight chart with no entries, goal ${target} kg` : `Weight chart, latest entry ${latest} kg, goal ${target} kg`,
    // Teplá litina §3.3: prázdná mřížka (jeden týden + věta), popisek týdne „9/29“, plné názvy dní pro čtečku.
    activityEmpty: 'Every day you train shows up here. Your first dot lands after a lesson.',
    weekShort: (d: number, m: number) => `${m}/${d}`,
    weekdaysShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    // Binární milník (ano/ne) jako číslo 0 / 1, stejná gramatika jako číselný.
    milestoneYes: 'Yes', milestoneNo: 'Not yet',
    newCosmetic: 'NEW COSMETIC', toWardrobe: 'Open Wardrobe', dismiss: 'Close',
    saveError: 'Couldn’t save. Try again.',
    // Nothing Dot fáze 2: hero dlaždice, součet aktivity, štítek vize, hodnota váhy a krátká pilulka zápisu.
    activeTitle: 'Active days', activeSub: 'Last 5 weeks',
    longestTitle: 'Longest streak', longestSub: 'Your record',
    activeTally: (n: number, total: number) => `${n} / ${total}`,
    visionLabel: 'VISION',
    weightA11y: (kg: string) => `Latest entry ${kg} kg`,
    logWeightCta: 'Log weight',
  },
  wardrobe: {
    title: 'Wardrobe',
    slots: { outfit: 'Outfit', accessory: 'Accessory', mapBackground: 'Map', lessonEffect: 'Effect', profileFrame: 'Frame' },
    bananas: 'BANANAS', buy: (p: number) => `Buy for ${p}`, equip: 'Equip', unequip: 'Unequip', seasonNever: 'Never coming back',
    lock: {
      milestoneCompleted: (n: number) => `Complete ${n} ${plural(n, 'milestone', 'milestones')}`,
      streak: (d: number) => `Streak ${days(d)}`,
      season: (name: string) => `${name} season reward`,
    },
    insufficient: 'Not enough bananas. You earn them with XP.',
    price: (p: number) => `${p} BANANAS`, owned: 'OWNED', equipped: 'EQUIPPED', seasonUnknown: 'season',
    buyConfirm: (name: string, p: number) => `Buy ${name} for ${p} ${plural(p, 'banana', 'bananas')}?`,
    buyYes: 'Buy', cancel: 'Cancel', close: 'Close Wardrobe', errorWhat: 'the wardrobe',
    actionError: 'That didn’t work. Try again.',
    empty: 'Nothing in this slot yet.',
    tileA11y: (name: string, state: string) => `${name}, ${state}`,
    state: { equipped: 'equipped, tap to unequip', unlocked: 'tap to equip', buy: 'tap to buy', locked: 'locked' },
    preview: 'Monkey preview with equipped items',
    // Nothing Dot fáze 2: mono štítek zamčené položky a zůstatek banánů pro čtečku.
    locked: 'LOCKED',
    bananasA11y: (n: number) => `${n} ${plural(n, 'banana', 'bananas')}`,
  },
  profile: {
    // Nothing Dot fáze 2: stavový řádek, dlaždice statistik a odkaz do šatníku.
    pathStatus: (name: string) => `PATH ${String(name).toUpperCase()}`,
    xpNumber: (n: number) => thousands(n),
    xpUnit: 'XP', stageOf: (max: number) => `/ ${max}`, statStreak: 'Current streak',
    statLongest: 'Longest streak', badgeOf: (total: number) => `/ ${total}`,
    wardrobeLine: 'Outfits, accessories and frames for your monkey',
    xp: 'TOTAL XP', stage: 'STAGE', path: 'PATH', streak: 'STREAK', badges: 'BADGES',
    wardrobe: 'Wardrobe', settings: 'Settings', noBadges: 'No badges yet.',
    badgeCount: (n: number) => `${n} ${plural(n, 'badge', 'badges')}`,
    days: 'D', errorWhat: 'your profile',
    // Teplá litina §3.5: StatGrid, karta série a sekce odznaků.
    statXp: 'Total XP', statStage: 'Stage', statBadges: 'Badges',
    xpValue: (n: number) => `${thousands(n)} XP`,
    stageValue: (n: number) => `Stage ${n}`,
    badgeRatio: (earned: number, total: number) => `${earned} / ${total}`,
    badgeRatioA11y: (earned: number, total: number) => `${earned} of ${total} badges earned`,
    streakLabel: 'Streak',
    streakDays: (n: number) => days(n),
    pathLine: (name: string) => `Path: ${name}`,
  },
  notifications: {
    title: 'Monkey',
    // Teplá litina §3.7: tichý tón, bez emoji. Při nulové sérii nabídne délku lekce, když ji volající zná.
    reminder: (n: number, minutes?: number) => (n > 0
      ? `Your monkey is waiting for today’s lesson. Streak: ${days(n)}.`
      : typeof minutes === 'number' && Number.isFinite(minutes)
        ? `Your monkey is waiting for today’s lesson. Just ${minutes} ${plural(minutes, 'minute', 'minutes')}.`
        : 'Your monkey is waiting for today’s lesson.'),
  },
  settings: {
    dataSection: 'Data', reset: 'Reset app', resetLine: 'Deletes your progress and starts again from the beginning.',
    resetTitle: 'Reset app?', resetConfirm: 'All progress, XP, streak and goals will be deleted. The app starts from the beginning.',
    resetCancel: 'Cancel', resetDo: 'Reset',
    title: 'Settings', theme: 'Theme', themeOptions: { system: 'System', light: 'Light', dark: 'Dark' },
    reminder: 'Daily reminder', hour: 'Hour', sendTest: 'Send test notification',
    denied: 'Notifications are turned off in system settings.', openSettings: 'Open settings', dev: 'Dev menu',
    unsupported: 'Notifications don’t work on the web. Try it on your phone.', hourValue: (h: number) => `${String(h).padStart(2, '0')}:00`,
    sent: 'Sent.', hourDown: 'Remind earlier', hourUp: 'Remind later',
    // Motion spec §6.2: dva nezávislé přepínače.
    feedback: 'Feedback', haptics: 'Haptics', hapticsLine: 'Light vibrations on taps and celebrations.',
    sound: 'Sounds', soundLine: 'Short plate and celebration sounds.',
    hourPick: 'Reminder time', appearance: 'Appearance', reminderSection: 'Reminder',
  },
  // Nastavení → Cíle: přehled v Nastavení a čtyři editory (milníky, váha, vize, cesta).
  goals: {
    section: 'Goals', save: 'Save', cancel: 'Cancel', close: 'Close',
    rows: { milestones: 'Milestones', weight: 'Weight goal', dream: 'Body vision', path: 'Training path' },
    rowA11y: (title: string, value: string) => `${title}: ${value}. Edit.`,
    loadError: 'Couldn’t load your goals.', noProfile: 'No profile yet.',
    // Váha s desetinnou tečkou: „82.5“.
    kg: (n: number) => String(n),
    weightNone: 'No goal',
    weightValue: (kind: 'lose' | 'gain', start: number, target: number) =>
      `${kind === 'lose' ? 'Lose' : 'Gain'} · ${start} → ${target} kg`,
    errors: {
      milestoneCount: 'Keep 2 or 3 milestones.',
      milestoneTarget: 'The target must be a whole number from 1 to 9999.',
      weight: 'Check your weight. The goal has to match the direction.',
      dream: 'Your vision needs 3 to 140 characters.',
      path: 'We don’t know that path. Pick another.',
      unknown: 'Couldn’t save. Try again.',
    },
    milestones: {
      title: 'Milestones', lead: 'Keep 2 or 3. Progress on the ones you keep stays.',
      yours: 'Your milestones', add: 'Add milestone', count: (n: number, max: number) => `${n} / ${max}`,
      progress: (current: number, target: number, unit: MilestoneUnit) => (unit === 'done'
        ? (current >= 1 ? 'Done' : 'Not done yet')
        : `Progress ${current} / ${target} ${MILESTONE_UNIT_SHORT[unit]}`),
      remove: (label: string) => `Remove milestone ${label}`,
      minHint: 'You need at least 2 milestones. Add one first.',
      fullHint: 'You have 3 milestones. Remove one first.',
      noPresets: 'You already have every preset for this path. Write your own.',
    },
    weight: { title: 'Weight goal', lead: 'Optional. The weight chart only shows with a goal.', start: 'Starting weight' },
    dream: { title: 'Body vision', lead: 'One vision, shown at the top of Progress.' },
    path: {
      title: 'Training path', lead: 'You train one path at a time. The monkey comes with you.',
      notice: 'The map switches to the new path. Finished lessons stay.',
    },
  },
  dev: {
    title: 'Dev menu', demo: 'Load demo profile',
    dots: 'Dots', poses: 'Monkey poses', repertoire: 'Repertoire poses',
    // Popisky nových póz repertoáru (galerie /dev): co opička dělá a kdy.
    repertoireCaption: {
      warmup: 'Warm-up · map idle', boredSit: 'Bored on a plate · map idle', pointStart: 'Points at Start · no tap 25 s',
      giggle: 'Giggle · belly tap', strain: 'Strain · last 3 s of a hold', wipeSweat: 'Towel and bottle · rest',
      liftBarbell: 'Barbell overhead · lesson done', eveningTowel: 'Headband and towel · evening',
      streakAtRisk: 'Checks the watch · streak at risk', ropeTangle: 'Tangled in rope · error', peekBox: 'Peeks into the box · empty',
    } as Record<string, string>, poseAuto: 'Play all poses', posePlay: (id: string) => `Play pose ${id}`, dotState: { locked: 'Locked', current: 'Current', done: 'Done' }, reset: 'Reset app', resetConfirm: 'Delete all data? The theme stays.', xp: '+500 XP',
    stage: (s: number | null) => `Monkey stage: ${s ?? 'auto'}`, seasonEnd: 'Jump to season end',
    streakLoss: 'Simulate streak loss', resetTime: 'Reset time offset', now: 'NOW', offset: 'OFFSET',
    offsetValue: (d: number, h: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d)} D ${h} H`, // nezlomitelné mezery: telemetrie se nesmí zalomit
    noSeason: 'No season is running right now to skip.', done: 'Done',
    // Repertoár 26 animací (/dev): tlačítko pro každou akci na velké opici, v pořadí plánu.
    actions: 'Monkey actions', actionsPlayAll: 'Play all', actionsStop: 'Stop', actionsNow: 'NOW PLAYING',
    actionPlay: (label: string) => `Play: ${label}`,
    action: {
      warmup: 'Warm-up', boredSit: 'Bored on a plate', sleep: 'Falls asleep · tap to wake', gaze: 'Follows your finger',
      pointStart: 'Points at Start', plateHop: 'Hops to the next plate', handstandPlate: 'Handstand on the plate',
      headShake: 'Head tap', giggle: 'Belly tap', flip: 'Rapid taps · flip', hangFinger: 'Hangs on your finger',
      trainAlong: 'Trains with you', strain: 'Last 3 s of a hold', wipeSweat: 'Rest · sweat and a sip', shrug: 'Skipped exercise',
      liftBarbell: 'Lesson done · barbell', flameJump: 'Streak record', climbPodium: 'League promotion', grow: 'Monkey grows',
      morningStretch: 'Morning stretch', eveningTowel: 'Evening towel', waveRun: 'Welcome back', streakAtRisk: 'Streak at risk',
      sadThenPoint: 'Streak lost', wifiShake: 'Offline', ropeTangle: 'Something broke', peekBox: 'Nothing here yet',
    } as Record<string, string>,
  },
  season: {
    errorWhat: 'the season', close: 'Close',
    none: 'No season is running right now.',
    noneBody: 'Lessons still count toward your league and streak.',
    // Hlavička: „9/28 – 12/26“ (data skládá obrazovka z čísel).
    dateShort: (d: number, m: number) => `${m}/${d}`,
    range: (from: string, to: string) => `${from} – ${to}`,
    daysLeftLabel: 'LEFT', daysLeftCaption: 'days left',
    daysLeftA11y: (n: number) => `${days(n)} left in the season`,
    ended: 'The season is over.', endedBody: 'We added up everything you put in.',
    lockIn: 'Lock in', lockInBody: 'Pick one goal for the whole season.', lockInCta: 'Set goal',
    goalLabel: 'SEASON GOAL',
    goalKinds: { activeDays: 'Days without a miss', lessons: 'Lesson count', milestone: 'Milestone', weight: 'Weight' },
    goalKindLines: {
      activeDays: 'How many days you’ll train.', lessons: 'How many lessons you’ll do.',
      milestone: 'One exercise, more reps.', weight: 'How many kg you’ll lose or gain.',
    },
    // Jednotky velkého Statu progresu (verzálky jako ostatní jednotky v hlavičkách).
    units: { activeDays: 'DAYS', lessons: 'LESSONS', reps: 'REPS', seconds: 'SECONDS', weight: 'KG' },
    progressOf: (target: string, unit: string) => `/ ${target} ${unit}`,
    progressA11y: (value: string, target: string, unit: string) => `${value} of ${target} ${unit}`,
    met: 'Goal reached. Claim your reward when the season ends.',
    gridLabel: 'SEASON DAYS',
    legend: { active: 'TRAINED', repaired: 'CAUGHT UP', missed: 'MISSED', today: 'TODAY' },
    gridA11y: (done: number, total: number) => `Trained ${done} of ${total} season days`,
    record: 'Log value', recordField: 'Current value', recordSave: 'Save', recordCancel: 'Cancel',
    recordError: 'Enter a whole number from 0.',
    comebackTitle: 'You can catch up',
    comebackBody: (n: number) => `Fix a missed day with a second lesson in one day. Window: ${days(n)}.`,
    comebackEmpty: 'Nothing to catch up on.',
    comebackWindow: 'WINDOW',
    // Cíl už nejde stihnout. Nikdy „prohráno“ (spec §7.7): recap počítá každou lekci.
    unreachable: 'You can’t hit the full goal this season anymore. Every lesson still counts toward your recap.',
    rewardTitle: 'Reward', rewardItem: (season: string) => `${season} scarf and badge`, rewardNever: 'Never coming back',
    recapCta: 'Your recap', claimedNote: 'Reward claimed',
    // Modal cíle.
    goalTitle: 'Season goal', goalLead: 'One goal for the whole season. You can change it until the season ends.',
    goalValue: { activeDays: 'Number of days', lessons: 'Number of lessons', weight: 'Weight change' },
    weightDir: { down: 'Lose', up: 'Gain' },
    milestonePick: 'Milestone', milestoneCustom: 'Custom milestone',
    milestoneName: 'Name', milestoneTarget: 'Target', milestoneCurrent: 'You can do now',
    milestoneUnit: { reps: 'Reps', seconds: 'Seconds' },
    milestoneChip: (label: string, target: number, unit: 'reps' | 'seconds') => `${label} ${unit === 'reps' ? `${target}×` : `${target} s`}`,
    goalErrors: {
      daysRange: 'Enter 1 to 90 days.',
      countRange: 'Enter 1 to 500 lessons.',
      targetRange: 'The target must be a whole number from 1 to 1000, the current value from 0.',
      deltaRange: 'Enter a change from 0.1 to 30 kg.',
    },
    // Nothing Dot fáze 2: hero odpočtu a prstenec postupu, součet dní, zamčená odměna.
    daysLeftKicker: 'DAYS LEFT', endedKicker: 'SEASON OVER',
    elapsedKicker: 'ELAPSED',
    elapsedPct: (pct: number) => `${pct} %`,
    elapsedA11y: (pct: number) => `${pct} % of the season elapsed`,
    gridTally: (done: number, total: number) => `${done} / ${total}`,
    rewardLocked: 'REWARD · LOCKED', selected: 'SELECTED',
    nameMissing: 'The milestone needs a name.',
    saveError: 'Couldn’t save the goal. Try again.',
  },
  recap: {
    beforeAfter: 'BEFORE & AFTER', lessons: 'LESSONS', streak: 'LONGEST STREAK', growth: 'MONKEY GROWTH', reward: 'REWARD',
    rewardEarned: 'The Winter Arc scarf is yours.', rewardMissed: 'No scarf this time. You still get the participation badge.',
    share: 'Share', shareSoon: 'Sharing is coming soon.', claim: 'Claim reward', claimed: 'Claimed',
    claimError: 'Couldn’t claim the reward. Try again.',
    labels: { weight: 'Weight', activeDays: 'Active days', lessons: 'Lessons' },
    before: 'BEFORE', after: 'AFTER',
    // Nothing Dot fáze 2: mono řádek „BEFORE 12 REPS“ (nezlomitelné mezery uvnitř položky).
    beforeAfterValue: (key: string, value: string, unit: string) => `${key} ${value} ${unit}`,
    units: { kg: 'kg', reps: 'reps', seconds: 'seconds', days: 'days', lessons: 'lessons' },
    lessonsLine: 'Across the whole season. Each one moved your monkey forward.',
    streakUnit: (n: number) => plural(n, 'day', 'days'),
    streakLine: 'That many days in a row without a miss.',
    growthLine: (from: string, to: string) => `${from} → ${to}`,
    growthSame: 'Your monkey is holding form. The next stage waits next season.',
    progressLabel: 'RECAP',
    progressValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    progressA11y: (n: number, total: number) => `Slide ${n} of ${total}`,
    close: 'Close recap', prev: 'Previous slide', next: 'Next slide', errorWhat: 'the recap',
  },
  stageUp: {
    names: { 1: 'BABY', 2: 'TEENAGER', 3: 'ALPHA' },
    label: (n: number, name: string) => `STAGE ${String(n).padStart(2, '0')} · ${name}`,
    title: 'Your monkey is growing.', cta: 'Continue',
    a11y: (n: number, name: string) => `Your monkey grew. Stage ${n}, ${name}.`,
  },
  // Nothing Dot: tečkové prvky a nové primitivy (stavový řádek, hero dlaždice mapy).
  dots: {
    plateA11y: (kg: number, state: string) => `Plate ${kg} kg, ${state}`,
  },
  status: {
    // Pravá strana stavového řádku mapy: živý údaj série („12 DAYS“), tečka bliká, dokud dnes nic nebylo.
    streak: (n: number) => days(n).toUpperCase(),
    streakA11y: (n: number, todayDone: boolean) => `Streak ${days(n)}, ${todayDone ? 'done today' : 'today pending'}`,
  },
  hero: {
    name: 'Lessons in section',
    next: (title: string) => `Next: ${title}`,
    allDone: 'Section done',
  },
  mascot: {
    // Popisek pro čtečku obrazovky podle nálady.
    label: { idle: 'Your monkey', happy: 'Your monkey is happy', celebrate: 'Your monkey is celebrating', sad: 'Your monkey is sad' },
    // Reaktivní opička (fáze 3): co s ní jde dělat.
    playHint: 'Tap to make it hop, tap three times fast for a backflip, hold to pet it',
  },
  // Vstupní test a bezpečnost (elite fáze 5). Zdroje: ACSM push-up test, PAR-Q+ 2024 (docs/research/2026-10-08-vstupni-test.md).
  fitness: {
    kicker: 'QUICK TEST',
    title: 'Find your level',
    intro: 'Two short tests set your starting reps and holds. Your lessons use about half of your max, so you always have a few reps left.',
    skip: 'Skip, use default',
    pushupsTitle: 'Push-ups',
    pushupsHow: 'As many as you can in a row with good form. Chest close to the floor, body straight. Stop when form breaks.',
    kneeToggle: 'I did them on my knees',
    plankTitle: 'Forearm plank',
    plankHow: 'Hold as long as you can with hips in line. Stop when your hips sag or your back hurts.',
    startTimer: 'Start', stopTimer: 'Stop',
    seconds: 's', reps: 'reps',
    resultTitle: 'Your starting point',
    // Násobek přesně (max. 2 desetinná, bez koncových nul): ×0.75, ×1.5, ×1.
    resultLine: (reps: number, hold: number) => `Lessons scaled: reps ×${factor(reps)}, holds ×${factor(hold)}`,
    resultDefault: 'Not entered · default',
    save: 'Save',
    retest: 'Retake level test',
    retestHint: 'Retake every few weeks as you get stronger.',
    // Zjednodušená kontrola připravenosti podle 7 obecných otázek PAR-Q+ 2024.
    readinessTitle: 'Before you start',
    readinessIntro: 'Answer honestly. A yes doesn’t stop you, but talk to a doctor first.',
    readiness: [
      'Has a doctor said you have a heart condition or high blood pressure?',
      'Do you feel chest pain at rest, in daily life or during exercise?',
      'Have you lost balance from dizziness or passed out in the last 12 months?',
      'Do you have another chronic medical condition?',
      'Do you take prescribed medication for a chronic condition?',
      'Do you have a bone, joint or muscle problem that exercise could make worse?',
      'Has a doctor said you should only exercise under medical supervision?',
    ],
    yes: 'Yes', no: 'No',
    consult: 'Please check with a doctor before training. You can still look around the app.',
    disclaimer: 'This app is not medical advice and doesn’t replace a coach or doctor. Stop if you feel pain, dizziness or chest pressure.',
    caution: 'Advanced move. Use a wall or soft floor, warm up your wrists, and stop if anything hurts.',
    // UI vstupního testu (design-agent, elite fáze 5).
    // Doto titulek hlavičky: krátký, aby se na 320 pt vešel vedle křížku (celé „Find your level“ nese nadpis kroku).
    headerTitle: 'Level',
    cautionLabel: 'CAUTION',
    next: 'Next', back: 'Back', skipShort: 'Skip',
    stepValue: (n: number, total: number) => `${String(n).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
    questionA11y: (n: number, q: string) => `Question ${n}. ${q}`,
    pushupsField: 'Push-ups in a row', plankField: 'Plank seconds',
    minus: (step: number, unit: string) => `${step} ${step === 1 ? unit.replace(/s$/, '') : unit} less`, plus: (step: number, unit: string) => `${step} ${step === 1 ? unit.replace(/s$/, '') : unit} more`,
    repsWord: 'reps', secondsWord: 'seconds',
    timerA11y: (s: number, running: boolean) => `${s} seconds${running ? ', running' : ''}`,
    timerHint: 'Runs on the clock, so it keeps time if your screen locks.',
    saveError: 'Couldn’t save. Try again.',
    // Řádek ve Finish setup a v Nastavení.
    optional: 'OPTIONAL',
    rowNone: 'Not tested · default reps',
    rowValue: (pushups: number, plankS: number) => `${pushups} push-ups · ${plankS} s plank`,
    safetySection: 'Training level',
  },
  // Repliky opičky (elite fáze 3): ťuknutí na mapě, max 32 znaků, žádné výčitky.
  mascotLines: {
    morning: ['Morning. Bar’s cold.', 'Early plates hit different.', 'Coffee first? Then a plate.'],
    day: ['One plate before lunch?', 'Good time for a short one.', 'Midday reps. Let’s go.'],
    evening: ['Evening session? I’m in.', 'Still time for today’s plate.', 'Wind down with one lesson.'],
    night: ['Late, huh. I’m awake too.', 'Short one, then sleep.', 'Night owls lift too.'],
    streakOn: ['Streak’s alive. Keep it fed.', 'Day by day. Nice.', 'Don’t break the chain.'],
    streakHot: ['Week-plus streak. Respect.', 'You’re on fire.', 'This streak is getting heavy.'],
    todayDone: ['Done for today. Rest up.', 'Plate earned. Go relax.', 'Today’s in the bag.', 'Nice work. See you tomorrow.'],
  },
  // Opička průvodce (elite fáze 1): jedna krátká věta na obrazovku při prvním průchodu.
  guide: {
    mapStart: 'Tap Start to begin',
    lessonHold: 'Tap Start and hold the position',
    // Cvik na opakování nemá časovač: stejná bublina, jiná věta (výběr podle `exercise.type`).
    lessonReps: 'Do the reps, then tap Done',
    celebrationFirst: 'That’s your first plate',
    kicker: 'MONKEY',
    dismissA11y: 'Dismiss tip',
  },
  // UX pass U4: progresivní odhalení. Zamčené funkce zůstanou vidět s klidnou pozvánkou (ne skryté).
  disclosure: {
    kicker: 'LOCKED',
    unlocksIn: (n: number) => `Unlocks after ${n} more ${plural(n, 'lesson', 'lessons')}`,
    tally: (done: number, need: number) => `${done} / ${need}`,
    tallyA11y: (done: number, need: number) => `${done} of ${need} lessons done`,
    what: {
      league: 'A weekly table with people at your level. Lessons earn XP and move you up.',
      season: 'One goal for the whole season, with a reward you keep. Every lesson counts.',
      wardrobe: 'Outfits, accessories and frames for your monkey, bought with bananas from XP.',
    },
    cta: 'Do a lesson',
    tabA11y: (title: string, n: number) => `${title}, locked, unlocks after ${n} more ${plural(n, 'lesson', 'lessons')}`,
    tileA11y: (title: string, n: number) => `${title}, locked, unlocks after ${n} more ${plural(n, 'lesson', 'lessons')}`,
  },
  // UX pass U4: řádek „důvod se vrátit“ pod pokrokem sekce na mapě. Věty sentence case, bez výčitky.
  returnLine: {
    next: (title: string, minutes: number) => keepUnits(`Next: ${title} · ${minutes} min`),
    atRisk: 'Streak ends tonight.',
    done: 'Done today · see you tomorrow.',
  },
  // Krátký onboarding (elite fáze 1): cíle se doplní až po první lekci.
  setup: {
    // Nízký displej: krátký štítek, aby se nevyřízl (celé znění nese tileA11y).
    tileShort: (n: number) => `Setup · ${n}`,
    tile: (n: number) => `Finish setup · ${n} ${plural(n, 'step', 'steps')}`,
    tileA11y: (n: number) => `Finish setup, ${n} ${plural(n, 'step', 'steps')} left`,
    setGoals: 'Set your goals',
    kicker: 'SETUP',
    steps: (n: number) => `${n} ${plural(n, 'step', 'steps')}`,
    title: 'Finish setup',
    lead: 'We picked starter goals for you. Make them yours, or keep them.',
    rows: { dream: 'Body vision', milestones: 'Milestones', weight: 'Weight goal', reminder: 'Daily reminder' },
    reminderOff: 'Off · turn it on in Settings',
    done: 'Done',
    saveError: 'Couldn’t save. Try again.',
  },
} as const;
