import { contrast, inkOn } from '../ink';
import { dark, light, type Colors } from '../palettes';

const TEXT_TOKENS = ['text', 'muted', 'accentText', 'danger'] as const;
const BACKGROUNDS = ['base', 'surface', 'raised'] as const;
const PLATES = ['plate5', 'plate10', 'plate15', 'plate20', 'plate25'] as const;

describe.each([['dark', dark as Colors], ['light', light]] as const)('%s paleta', (_name, c) => {
  it.each(TEXT_TOKENS.flatMap((t) => BACKGROUNDS.map((bg) => [t, bg] as const)))('%s na %s má kontrast ≥ 4.5:1', (t, bg) => {
    expect(contrast(c[t], c[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it('onAccent na accent má kontrast ≥ 4.5:1', () => {
    expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
  });
  it('onSeasonGold na seasonGold (sezónní štítek) má kontrast ≥ 4.5:1', () => {
    expect(c.seasonGold).toBe('#C6A15B');
    expect(contrast(c.onSeasonGold, c.seasonGold)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(PLATES)('kg číslo (inkOn) na %s má kontrast ≥ 4.5:1', (p) => {
    expect(contrast(inkOn(c[p], c), c[p])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('inkOn', () => {
  it('na světlém kotouči volí tmavý inkoust, na tmavém světlý', () => {
    expect(inkOn(light.plate5, light)).toBe(light.text);
    expect(inkOn(light.plate25, light)).toBe(light.base);
    expect(inkOn(dark.plate25, dark)).toBe(dark.text);
  });
});
