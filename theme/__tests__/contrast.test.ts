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

describe('inkOn', () => {
  it('na světlém kotouči volí tmavý inkoust, na tmavém světlý', () => {
    expect(inkOn(light.plate5, light)).toBe(light.text);
    expect(inkOn(light.plate25, light)).toBe(light.base);
    expect(inkOn(dark.plate25, dark)).toBe(dark.text);
  });
});

// Nothing Dot (spec 2026-10-05 §2.1): monochrom bez akcentu, dlaždice a tečky.
describe.each([['dark', dark as Colors], ['light', light]] as const)('Nothing Dot %s', (_name, c) => {
  it('text na base i tile ≥ 4.5:1', () => {
    expect(contrast(c.text, c.base)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.text, c.tile)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.text, c.tilePressed)).toBeGreaterThanOrEqual(4.5);
  });
  it('muted na tile ≥ 4.5:1', () => expect(contrast(c.muted, c.tile)).toBeGreaterThanOrEqual(4.5));
  it('onText na text (primární CTA) ≥ 4.5:1', () => expect(contrast(c.onText, c.text)).toBeGreaterThanOrEqual(4.5));
  it('rozsvícená tečka (text) vs. zhasnutá (dotOff) ≥ 3:1', () => expect(contrast(c.text, c.dotOff)).toBeGreaterThanOrEqual(3));
  it('žádný akcent: accent i accentGraphic = text', () => {
    expect(c.accent).toBe(c.text);
    expect(c.accentGraphic).toBe(c.text);
  });
  it('žádná čistá čerň ani bílá', () => {
    Object.values(c).forEach((v) => expect(['#000', '#000000', '#FFF', '#FFFFFF']).not.toContain(String(v).toUpperCase()));
  });
});

// Stage-up (QA fáze 2 N2): primární pilulka na zlaté = výplň `onSeasonGold`, popisek `onGoldPill`.
describe.each([['dark', dark as Colors], ['light', light]] as const)('CTA na seasonGold %s', (_name, c) => {
  it('hrana pilulky proti zlaté ploše ≥ 3:1', () => expect(contrast(c.onSeasonGold, c.seasonGold)).toBeGreaterThanOrEqual(3));
  it('popisek na pilulce ≥ 4.5:1', () => expect(contrast(c.onGoldPill, c.onSeasonGold)).toBeGreaterThanOrEqual(4.5));
});
