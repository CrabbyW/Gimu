import { contrast, inkOn } from '../ink';
import { dark, light, type Colors } from '../palettes';

const TEXT_TOKENS = ['text', 'muted', 'accentText', 'danger'] as const;
const BACKGROUNDS = ['base', 'surface', 'raised'] as const;
const PLATES = ['plate5', 'plate10', 'plate15', 'plate20', 'plate25'] as const;

describe.each([['dark', dark as Colors], ['light', light]] as const)('%s paleta', (_name, c) => {
  it.each(TEXT_TOKENS.flatMap((t) => BACKGROUNDS.map((bg) => [t, bg] as const)))('%s na %s má kontrast ≥ 4.5:1', (t, bg) => {
    expect(contrast(c[t], c[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['accent', 'accentPressed'] as const)('onAccent na %s má kontrast ≥ 4.5:1', (bg) => {
    expect(contrast(c.onAccent, c[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it('text na raisedPressed (stisk secondary) má kontrast ≥ 4.5:1', () => {
    expect(contrast(c.text, c.raisedPressed)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['danger', 'success'] as const)('%s na surface (formulář) má kontrast ≥ 4.5:1', (t) => {
    expect(contrast(c[t], c.surface)).toBeGreaterThanOrEqual(4.5);
  });
  // Grafika (WCAG 1.4.11): prstence, tečky, proužky, výplň progresu, kotouče série.
  it.each(BACKGROUNDS)('accentGraphic na %s má kontrast ≥ 3:1', (bg) => {
    expect(contrast(c.accentGraphic, c[bg])).toBeGreaterThanOrEqual(3);
  });
  it.each(['base', 'surface'] as const)('faint (ghost grafika) na %s má kontrast ≥ 3:1', (bg) => {
    expect(contrast(c.faint, c[bg])).toBeGreaterThanOrEqual(3);
  });
  it('konfety onAccent na akcentové ploše stage-up mají kontrast ≥ 3:1', () => {
    expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(3);
  });
  it('onSeasonGold na seasonGold (sezónní štítek) má kontrast ≥ 4.5:1', () => {
    expect(c.seasonGold).toBe('#C6A15B');
    expect(contrast(c.onSeasonGold, c.seasonGold)).toBeGreaterThanOrEqual(4.5);
  });
  // Trojúhelník zóny ligy je grafický symbol vedle slova v `muted` (význam nese text) → WCAG 1.4.11, ≥ 3:1.
  // Hodnoty success/danger jsou dané spec §6.2 (light success má na base 4.36:1).
  it.each(['success', 'danger'] as const)('trojúhelník zóny ligy (%s) na base má kontrast ≥ 3:1', (t) => {
    expect(contrast(c[t], c.base)).toBeGreaterThanOrEqual(3);
  });
  it.each(PLATES)('kg číslo (inkOn) na %s má kontrast ≥ 4.5:1', (p) => {
    expect(contrast(inkOn(c[p], c), c[p])).toBeGreaterThanOrEqual(4.5);
  });
});

// Druhá barva konfet na stage-up ploše (`raised`) projde jen v dark; v light jsou konfety jen `onAccent`.
it('dark raised na accent (konfety stage-up) má kontrast ≥ 3:1', () => {
  expect(contrast(dark.raised, dark.accent)).toBeGreaterThanOrEqual(3);
});

// Hlídá pravidlo spec §2.1: dark `faint` se na `raised` nepoužívá. Kdyby se paleta změnila tak, že projde,
// pravidlo i tento test se dají zrušit.
it('dark faint na raised je pod 3:1 (ghost grafika se v kartě kreslí na surface)', () => {
  expect(contrast(dark.faint, dark.raised)).toBeLessThan(3);
});

describe('inkOn', () => {
  it('na světlém kotouči volí tmavý inkoust, na tmavém světlý', () => {
    expect(inkOn(light.plate5, light)).toBe(light.text);
    expect(inkOn(light.plate25, light)).toBe(light.base);
    expect(inkOn(dark.plate25, dark)).toBe(dark.text);
  });
});
