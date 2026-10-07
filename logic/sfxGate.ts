// Omezovač zvuků (elite fáze 2, spec §4): stejný zvuk nejvýš jednou za `minGapMs`, aby rychlé sledy (tah po tab
// baru, napočítání XP) „nezabzučely“. Různé zvuky se neblokují. Čistá logika, čas se předává zvenku.
export function createSfxGate(minGapMs: number) {
  const last = new Map<string, number>();
  return {
    allow(name: string, now: number): boolean {
      const prev = last.get(name);
      if (prev !== undefined && now - prev < minGapMs) return false;
      last.set(name, now);
      return true;
    },
  };
}
