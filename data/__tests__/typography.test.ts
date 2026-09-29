import { copy } from '@/data/copy';
import { EXERCISES } from '@/data/exercises';
import { LEAGUE_TIERS } from '@/data/leagues';
import { LESSONS } from '@/data/lessons';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { PATHS } from '@/data/paths';
import { SEASONS } from '@/data/seasons';

// Česká typografie: jednopísmenná předložka nebo spojka nesmí zůstat na konci řádku
// („Opice půjde s / tebou.“). Za ní patří nezlomitelná mezera ( ), ne obyčejná.
const ORPHAN = /(^|[\s(„])([ksvzouaiKSVZOUAI]) /;

/** Všechny řetězce v datech; funkce v copy se zavolají s ukázkovými argumenty. */
function strings(value: unknown, path: string, out: [string, string][]): [string, string][] {
  if (typeof value === 'string') out.push([path, value]);
  else if (typeof value === 'function') strings((value as (...a: unknown[]) => unknown)(3, 'Stojka', 'seconds'), `${path}()`, out);
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => strings(v, `${path}.${k}`, out));
  return out;
}

test('detektor pozná sirotka a nezlomitelnou mezeru nechá projít', () => {
  expect(ORPHAN.test('Opice půjde s tebou.')).toBe(true);
  expect(ORPHAN.test('A pak dál')).toBe(true);
  expect(ORPHAN.test('Opice půjde s tebou.')).toBe(false);
  expect(ORPHAN.test('Plank, stojka, L-sit.')).toBe(false);
});

test.each([
  ['copy', copy], ['PATHS', PATHS], ['MILESTONE_PRESETS', MILESTONE_PRESETS], ['EXERCISES', EXERCISES],
  ['LESSONS', LESSONS], ['LEAGUE_TIERS', LEAGUE_TIERS], ['SEASONS', SEASONS],
])('%s: žádná jednopísmenná slova na konci řádku', (name, data) => {
  const orphans = strings(data, name, []).filter(([, s]) => ORPHAN.test(s));
  expect(orphans).toEqual([]);
});
