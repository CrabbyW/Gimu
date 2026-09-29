import { dark, light, type Colors } from '../palettes';

// WCAG 2.x relativní luminance a kontrastní poměr.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT_TOKENS = ['text', 'muted', 'accentText', 'danger'] as const;
const BACKGROUNDS = ['base', 'surface', 'raised'] as const;

// Otevřená výjimka čekající na rozhodnutí controlleru: dark danger #E5484D na raised = 4.25:1.
// `it.failing` je zelený, dokud kontrast neprojde — po opravě barvy zčervená a výjimka se smaže.
const KNOWN_FAILURES = new Set(['dark:danger:raised']);

describe.each([['dark', dark as Colors], ['light', light]] as const)('%s paleta', (name, c) => {
  for (const t of TEXT_TOKENS) {
    for (const bg of BACKGROUNDS) {
      const run = KNOWN_FAILURES.has(`${name}:${t}:${bg}`) ? it.failing : it;
      run(`${t} na ${bg} má kontrast ≥ 4.5:1`, () => {
        expect(contrast(c[t], c[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
  it('onAccent na accent má kontrast ≥ 4.5:1', () => {
    expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
