import type { MilestoneUnit } from '@/types';

const MILESTONE_UNIT_SHORT = { reps: '×', seconds: 's', kg: 'kg' } as const;

export const copy = {
  common: {
    continue: 'Pokračovat', back: 'Zpět', done: 'Hotovo', start: 'Start', pause: 'Pauza',
    resume: 'Pokračovat', retry: 'Zkusit znovu', loading: 'Načítám',
    loadError: (what: string) => `Nepodařilo se načíst ${what}.`,
    // Předmět věty „Nepodařilo se načíst …“ (4. pád).
    loadTarget: { profile: 'profil', path: 'cestu', lesson: 'lekci', lessonResult: 'výsledek lekce' },
  },
  tabs: { training: 'Trénink' },
  onboarding: {
    stepLabel: (n: number, total: number) => `KROK ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
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
  },
  lesson: {
    reps: 'OPAKOVÁNÍ', seconds: 'SEKUND', quitTitle: 'Ukončit lekci?', quitBody: 'Progres této lekce se neuloží.',
    quitConfirm: 'Ukončit', quitCancel: 'Trénovat dál', holdReady: 'Připrav se', nextExercise: 'Další cvik',
    close: 'Ukončit lekci',
    progressA11y: (n: number, total: number) => `Cvik ${n} z ${total}`,
    locked: 'Nejdřív dokonči předchozí lekci.', backToMap: 'Zpět na mapu',
  },
  complete: {
    title: 'Kotouč na ose.', xpLesson: 'lekce', xpBoss: 'boss', xpReplay: 'opakování', xpFirst: 'první dnes',
    xpStreak: 'streak', cta: 'Pokračovat', replayTitle: 'Opakování dělá mistra.',
  },
  leagueTier: 'LIGA',
  mascot: {
    // Popisek pro čtečku obrazovky podle nálady.
    label: { idle: 'Tvoje opice', happy: 'Tvoje opice má radost', celebrate: 'Tvoje opice slaví', sad: 'Tvoje opice je smutná' },
  },
} as const;
