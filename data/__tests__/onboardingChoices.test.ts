import { copy } from '@/data/copy';
import { DREAM_OPTIONS } from '@/data/dreams';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { composeDreamSentence, DREAM_MAX_LENGTH, isDreamValid } from '@/logic/onboarding';
import type { MilestoneUnit, PathId } from '@/types';

const PATHS: PathId[] = ['power', 'bodyControl', 'strength'];
const UNITS: MilestoneUnit[] = ['reps', 'seconds', 'kg', 'done'];

describe('vize těla (R36)', () => {
  test.each(PATHS)('%s má aspoň 6 karet', (p) => {
    expect(DREAM_OPTIONS[p].length).toBeGreaterThanOrEqual(6);
  });

  test('ID karet jsou unikátní v rámci cesty a každé má copy', () => {
    for (const p of PATHS) {
      const ids = DREAM_OPTIONS[p].map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(copy.onboarding.dream.options[id]).toBeDefined();
    }
  });

  test('titulky jsou unikátní napříč cestami a platí jako dreamBody', () => {
    const titles = PATHS.flatMap((p) => DREAM_OPTIONS[p].map((o) => copy.onboarding.dream.options[o.id].title));
    expect(new Set(titles).size).toBe(new Set(PATHS.flatMap((p) => DREAM_OPTIONS[p].map((o) => o.id))).size);
    for (const t of titles) {
      expect(isDreamValid(t)).toBe(true);
      expect(t.length).toBeLessThanOrEqual(DREAM_MAX_LENGTH);
    }
  });

  test('řádek karty se vejde na jeden řádek (≤ 34 znaků)', () => {
    for (const o of Object.values(copy.onboarding.dream.options)) expect(o.line.length).toBeLessThanOrEqual(34);
  });

  test('R41: složená věta „Titulek. Řádek“ je unikátní napříč cestami, platná a v limitu délky', () => {
    const sentences = PATHS.flatMap((p) => DREAM_OPTIONS[p].map((o) => {
      const meta = copy.onboarding.dream.options[o.id];
      return composeDreamSentence(meta.title, meta.line);
    }));
    expect(new Set(sentences).size).toBe(sentences.length);
    for (const s of sentences) {
      expect(isDreamValid(s)).toBe(true);
      expect(s.length).toBeLessThanOrEqual(DREAM_MAX_LENGTH);
    }
  });
});

describe('předvolby milníků (R37)', () => {
  test.each(PATHS)('%s má aspoň 6 předvoleb', (p) => {
    expect(MILESTONE_PRESETS[p].length).toBeGreaterThanOrEqual(6);
  });

  test('obecné předvolby existují', () => {
    expect(MILESTONE_PRESETS.general.length).toBeGreaterThanOrEqual(1);
  });

  test('ID jsou unikátní napříč všemi skupinami (cesta + general se zobrazují spolu)', () => {
    const ids = Object.values(MILESTONE_PRESETS).flat().map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('jednotky a cíle dávají smysl', () => {
    for (const m of Object.values(MILESTONE_PRESETS).flat()) {
      expect(UNITS).toContain(m.unit);
      expect(Number.isInteger(m.target)).toBe(true);
      if (m.unit === 'done') {
        expect(m.target).toBe(1);
      } else {
        expect(m.target).toBeGreaterThan(1);
        // Číslo cíle je vidět v popisku chipu.
        expect(m.label).toContain(String(m.target));
      }
      if (m.unit === 'seconds') expect(m.target).toBeLessThanOrEqual(300);
      if (m.unit === 'reps') expect(m.target).toBeLessThanOrEqual(100);
      if (m.unit === 'kg') expect(m.label).toMatch(/kg/);
    }
  });
});
