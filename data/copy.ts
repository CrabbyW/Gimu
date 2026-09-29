export const copy = {
  common: {
    continue: 'Pokračovat', back: 'Zpět', done: 'Hotovo', start: 'Start', pause: 'Pauza',
    resume: 'Pokračovat', retry: 'Zkusit znovu',
    loadError: (what: string) => `Nepodařilo se načíst ${what}.`,
    // Předmět věty „Nepodařilo se načíst …“ (4. pád).
    loadTarget: { profile: 'profil', path: 'cestu' },
  },
  tabs: { training: 'Trénink' },
  onboarding: {
    stepLabel: (n: number, total: number) => `KROK ${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    path: { title: 'Vyber si cestu', lead: 'Cestu můžeš později změnit. Opice půjde s tebou.' },
    dream: { title: 'Jaké tělo chceš?', lead: 'Jedna nebo dvě věty. Tohle budeš vídat nahoře v Progresu.', placeholder: 'Chci udělat muscle-up a mít viditelný sixpack.' },
    milestones: { title: 'První milníky', lead: 'Vyber 2 až 3. Můžeš napsat i vlastní.', addCustom: 'Vlastní milník', customLabel: 'Název', customTarget: 'Cíl', pickCount: (n: number) => `${n} / 3 vybráno` },
    weight: {
      title: 'Cíl váhy', lead: 'Volitelné. Graf váhy uvidíš jen s cílem.', lose: 'Hubnutí', gain: 'Nabírání', none: 'Neřeším',
      current: 'Aktuální váha', target: 'Cílová váha', unit: 'kg',
      errors: { invalid: 'Zadej číslo mezi 30 a 250 kg.', loseDirection: 'Při hubnutí musí být cíl nižší než aktuální váha.', gainDirection: 'Při nabírání musí být cíl vyšší než aktuální váha.' },
    },
    birth: { title: 'Tohle je tvoje opice.', lead: 'Poroste s každou lekcí.', cta: 'Jdeme trénovat', bornLabel: (date: string) => `NAROZENA ${date}` },
  },
  map: {
    sectionLabel: (n: number, title: string) => `SEKCE ${String(n).padStart(2, '0')} · ${title.toUpperCase()}`,
    start: 'Začít', replay: 'Zopakovat', locked: 'Nejdřív dokonči předchozí lekci.',
    exercises: (n: number) => (n >= 5 ? `${n} cviků` : `${n} cviky`), streak: 'STREAK', xp: 'XP', days: 'dní',
  },
  lesson: {
    reps: 'OPAKOVÁNÍ', seconds: 'SEKUND', quitTitle: 'Ukončit lekci?', quitBody: 'Progres této lekce se neuloží.',
    quitConfirm: 'Ukončit', quitCancel: 'Trénovat dál', holdReady: 'Připrav se', nextExercise: 'Další cvik',
  },
  complete: {
    title: 'Kotouč na ose.', xpLesson: 'lekce', xpBoss: 'boss', xpReplay: 'opakování', xpFirst: 'první dnes',
    xpStreak: 'streak', cta: 'Pokračovat', replayTitle: 'Opakování dělá mistra.',
  },
  leagueTier: 'LIGA',
} as const;
