// Tečkové písmo pro intro (Nothing styl): 5 × 7 matice na znak. Čistá data a výpočet pozic, bez Reactu.
// Intro rozsvěcuje tečky po sloupcích zleva doprava (`col` = pořadí sloupce v celém nápisu).

const GLYPHS: Record<string, readonly string[]> = {
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;
/** Mezera mezi znaky ve sloupcích. */
export const GLYPH_GAP = 1;

export interface GlyphDot { x: number; y: number; col: number }
export interface GlyphLayout { dots: GlyphDot[]; cols: number; rows: number }

/** Rozložení teček nápisu v mřížce (x, y ve sloupcích/řádcích). Neznámý znak = mezera. */
export function textDots(text: string): GlyphLayout {
  const dots: GlyphDot[] = [];
  let x0 = 0;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) {
      g.forEach((row, y) => { for (let x = 0; x < GLYPH_W; x++) if (row[x] === '#') dots.push({ x: x0 + x, y, col: x0 + x }); });
    }
    x0 += GLYPH_W + GLYPH_GAP;
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
