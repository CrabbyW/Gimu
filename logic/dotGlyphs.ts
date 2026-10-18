// Tečkové písmo pro intro (Nothing styl): 5 × 7 matice na znak. Čistá data a výpočet pozic, bez Reactu.
// Intro rozsvěcuje tečky po sloupcích zleva doprava (`col` = pořadí sloupce v celém nápisu).

const GLYPHS: Record<string, readonly string[]> = {
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
};

/** Splash (2026-10-13): „I“ s tečkou nahoře (řádek 0) a mezerou pod ní; tečka nad I je jediná `live`. */
export const SPLASH_GLYPHS: Record<string, readonly string[]> = {
  I: ['..#..', '.....', '..#..', '..#..', '..#..', '..#..', '..#..'],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;
/** Mezera mezi znaky ve sloupcích. */
export const GLYPH_GAP = 1;

/** `li` = pořadí znaku v textu (pro výběr tečky konkrétního písmene). */
export interface GlyphDot { x: number; y: number; col: number; li: number }
export interface GlyphLayout { dots: GlyphDot[]; cols: number; rows: number }

/** Rozložení teček nápisu v mřížce (x, y ve sloupcích/řádcích). Neznámý znak = mezera.
 *  `overrides` nahradí jednotlivé glyfy (např. `SPLASH_GLYPHS`). */
export function textDots(text: string, overrides: Record<string, readonly string[]> = {}): GlyphLayout {
  const dots: GlyphDot[] = [];
  let x0 = 0;
  let li = 0;
  for (const ch of text.toUpperCase()) {
    const g = overrides[ch] ?? GLYPHS[ch];
    if (g) {
      g.forEach((row, y) => { for (let x = 0; x < GLYPH_W; x++) if (row[x] === '#') dots.push({ x: x0 + x, y, col: x0 + x, li }); });
    }
    x0 += GLYPH_W + GLYPH_GAP;
    li++;
  }
  return { dots, cols: Math.max(0, x0 - GLYPH_GAP), rows: GLYPH_H };
}

/** Velikost buňky tak, aby nápis zabral nejvýš `maxWidth` (a nejvýš `maxCell`). */
export function fitCell(cols: number, maxWidth: number, maxCell: number): number {
  if (cols <= 0 || maxWidth <= 0) return 0;
  return Math.min(maxCell, Math.floor(maxWidth / cols));
}

/** Intro se hraje jen jednou za studený start (modulový stav žije s JS kontextem). */
let introPlayed = false;
export function takeIntro(): boolean {
  if (introPlayed) return false;
  introPlayed = true;
  return true;
}
/** Jen pro testy. */
export function resetIntroForTests(): void { introPlayed = false; }
