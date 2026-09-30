import { buildTheme, resolveScheme } from '../buildTheme';
import { dark, light } from '../palettes';
import { SEASON_OVERRIDES } from '../seasons';

describe('resolveScheme', () => {
  it('explicitní volba přebíjí systém', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });
  it('system přebírá schéma OS', () => {
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', 'dark')).toBe('dark');
  });
  it('neznámé schéma OS padá na tmavé', () => {
    expect(resolveScheme('system', null)).toBe('dark');
    expect(resolveScheme('system', undefined)).toBe('dark');
    expect(resolveScheme('system', 'unspecified')).toBe('dark');
  });
});

describe('buildTheme', () => {
  it('bez sezóny: paleta podle schématu a neutrální sezónní barvy z ní', () => {
    const t = buildTheme('light', null);
    expect(t.scheme).toBe('light');
    expect(t.c).toBe(light);
    expect(t.seasonal).toEqual({ headerBase: light.base, mapBase: light.base, mapRule: light.rule, mapTexture: null });
  });
  it('sezóna přepíše jen sezónní neutrály, paleta a akcent zůstávají', () => {
    const t = buildTheme('dark', 'winterArc');
    expect(t.c).toBe(dark);
    expect(t.c.accent).toBe('#FF6B35');
    expect(t.seasonal).toBe(SEASON_OVERRIDES.winterArc.dark);
    expect(buildTheme('light', 'summerBody').seasonal).toBe(SEASON_OVERRIDES.summerBody.light);
  });
  it('nese seasonThemeId (null mimo sezónu)', () => {
    expect(buildTheme('dark', 'winterArc').seasonThemeId).toBe('winterArc');
    expect(buildTheme('light', null).seasonThemeId).toBeNull();
  });
});
