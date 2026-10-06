import { copy } from '@/data/copy';
import { EXERCISES } from '@/data/exercises';
import { LEAGUE_TIERS } from '@/data/leagues';
import { LESSONS } from '@/data/lessons';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { PATHS } from '@/data/paths';
import { SEASONS } from '@/data/seasons';

// Anglická typografie UI (nahrazuje české pravidlo o jednopísmenných předložkách):
// 1) číslo a jeho jednotka se nesmí rozdělit na dva řádky („20 XP“, „3 min“, „5 kg“) — mezi nimi patří
//    nezlomitelná mezera, ne obyčejná. Hlídá se v textech generovaných funkcemi copy (tam skládáme čísla).
// 2) žádné dvojité mezery, žádná mezera na začátku/konci.
// 3) žádná zbylá čeština (diakritika).
const SPLIT_UNIT = /\d (XP|min|kg|s|days?|minutes?)\b/;
const DOUBLE_SPACE = /[  ]{2}|^\s|\s$/;
const CZECH = /[ěščřžýáíéůúťďňĚŠČŘŽÝÁÍÉŮÚŤĎŇ]/;

/** Všechny řetězce v datech; funkce v copy se zavolají s ukázkovými argumenty. */
function strings(value: unknown, path: string, out: [string, string, boolean][], generated = false): [string, string, boolean][] {
  if (typeof value === 'string') out.push([path, value, generated]);
  else if (typeof value === 'function') strings((value as (...a: unknown[]) => unknown)(3, 'Handstand', 'seconds'), `${path}()`, out, true);
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => strings(v, `${path}.${k}`, out, generated));
  return out;
}

test('detektory poznají chybu a správný tvar nechají projít', () => {
  expect(SPLIT_UNIT.test('+20 XP')).toBe(true);
  expect(SPLIT_UNIT.test('+20 XP')).toBe(false);
  expect(DOUBLE_SPACE.test('Start  lesson')).toBe(true);
  expect(DOUBLE_SPACE.test('Start lesson')).toBe(false);
});

const DATA = [
  ['copy', copy], ['PATHS', PATHS], ['MILESTONE_PRESETS', MILESTONE_PRESETS], ['EXERCISES', EXERCISES],
  ['LESSONS', LESSONS], ['LEAGUE_TIERS', LEAGUE_TIERS], ['SEASONS', SEASONS],
] as const;

test.each(DATA)('%s: bez dvojitých mezer a bez češtiny', (name, data) => {
  const bad = strings(data, name, []).filter(([, s]) => DOUBLE_SPACE.test(s) || CZECH.test(s));
  expect(bad).toEqual([]);
});

test('copy: generované číslo s jednotkou drží pohromadě', () => {
  const bad = strings(copy, 'copy', []).filter(([, s, gen]) => gen && SPLIT_UNIT.test(s));
  expect(bad).toEqual([]);
});
