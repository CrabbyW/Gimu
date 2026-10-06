import { dots } from '@/theme';
import type { DreamGlyphId } from '@/hooks/useOnboardingDraft';
import type { PathId } from '@/types';

/* Tečkové glyfy cest a vizí (Nothing Dot): stejné tvary jako dřívější plné SVG glyfy, ale složené z teček
 * na mřížce `dots.glyph.pitch` (výplň) a z teček po obvodu (obrys). Čistá geometrie ve viewBoxu 48. */

export interface GlyphDot { x: number; y: number }

type Prim =
  | { k: 'disc'; cx: number; cy: number; r: number }
  /** Kruh bez levého horního kvadrantu (výseč 270°). */
  | { k: 'wedge'; cx: number; cy: number; r: number }
  /** Horní polovina kruhu (kupole) se základnou na `cy`. */
  | { k: 'dome'; cx: number; cy: number; r: number }
  /** Obrys kruhu; `every` > 1 vynechává tečky (přerušovaný obrys). */
  | { k: 'ring'; cx: number; cy: number; r: number; every?: number }
  /** Otvor: z předchozí výplně odebere tečky uvnitř kruhu. */
  | { k: 'hole'; cx: number; cy: number; r: number };

const SHAPES: Record<DreamGlyphId, Prim[]> = {
  // Výseč: směr, výbuch (cesta Power).
  wedge: [{ k: 'wedge', cx: 24, cy: 24, r: 21 }],
  // Plný kruh nad obrysem: rovnováha (cesta Body control).
  balance: [{ k: 'disc', cx: 24, cy: 13, r: 9 }, { k: 'ring', cx: 24, cy: 35, r: 11 }],
  // Těžký kotouč s otvorem (cesta Strength).
  plate: [{ k: 'disc', cx: 24, cy: 24, r: 21 }, { k: 'hole', cx: 24, cy: 24, r: 6 }],
  rise: [{ k: 'disc', cx: 24, cy: 11, r: 8 }, { k: 'dome', cx: 24, cy: 46, r: 19 }],
  taper: [{ k: 'disc', cx: 24, cy: 17, r: 15 }, { k: 'disc', cx: 24, cy: 41, r: 6 }],
  stack: [{ k: 'disc', cx: 24, cy: 8, r: 7 }, { k: 'disc', cx: 24, cy: 24, r: 7 }, { k: 'disc', cx: 24, cy: 40, r: 7 }],
  // Silná obruč = dva soustředné obrysy.
  ring: [{ k: 'ring', cx: 24, cy: 24, r: 19 }, { k: 'ring', cx: 24, cy: 24, r: 14 }],
  trio: [{ k: 'disc', cx: 24, cy: 13, r: 9 }, { k: 'disc', cx: 13, cy: 33, r: 9 }, { k: 'disc', cx: 35, cy: 33, r: 9 }],
  inverted: [{ k: 'ring', cx: 24, cy: 15, r: 11 }, { k: 'disc', cx: 24, cy: 36, r: 9 }],
  orbit: [{ k: 'disc', cx: 21, cy: 27, r: 14 }, { k: 'disc', cx: 40, cy: 9, r: 5 }],
  // Terč: obrys a plný střed.
  core: [{ k: 'ring', cx: 24, cy: 24, r: 20 }, { k: 'disc', cx: 24, cy: 24, r: 8 }],
  pair: [{ k: 'disc', cx: 13, cy: 24, r: 11 }, { k: 'disc', cx: 35, cy: 24, r: 11 }],
  half: [{ k: 'dome', cx: 24, cy: 36, r: 22 }],
  // Přerušovaný obrys: prázdné místo pro vlastní vizi.
  custom: [{ k: 'ring', cx: 24, cy: 24, r: 19, every: 2 }],
};

/** Glyf cesty = glyf vize, který ji zastupuje (stejný tvar jako dřív). */
export const PATH_GLYPH: Record<PathId, DreamGlyphId> = { power: 'wedge', bodyControl: 'balance', strength: 'plate' };

const inside = (x: number, y: number, cx: number, cy: number, r: number) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function fill(p: Exclude<Prim, { k: 'ring' } | { k: 'hole' }>): GlyphDot[] {
  const { pitch, view } = dots.glyph;
  const out: GlyphDot[] = [];
  for (let y = pitch / 2; y < view; y += pitch) {
    for (let x = pitch / 2; x < view; x += pitch) {
      if (!inside(x, y, p.cx, p.cy, p.r)) continue;
      if (p.k === 'wedge' && x < p.cx && y < p.cy) continue; // chybí levý horní kvadrant
      if (p.k === 'dome' && y > p.cy) continue;
      out.push({ x, y });
    }
  }
  return out;
}

function ring(cx: number, cy: number, r: number, every = 1): GlyphDot[] {
  const n = Math.max(6, Math.round((2 * Math.PI * r) / dots.glyph.pitch));
  const out: GlyphDot[] = [];
  for (let i = 0; i < n; i += every) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
}

/** Tečky glyfu ve viewBoxu `dots.glyph.view`. */
export function glyphDots(id: DreamGlyphId): GlyphDot[] {
  let pts: GlyphDot[] = [];
  for (const p of SHAPES[id]) {
    if (p.k === 'ring') pts = pts.concat(ring(p.cx, p.cy, p.r, p.every));
    else if (p.k === 'hole') pts = pts.filter((d) => !inside(d.x, d.y, p.cx, p.cy, p.r));
    else pts = pts.concat(fill(p));
  }
  return pts;
}

/** Všechny tečky jako jedna SVG cesta (jeden uzel místo desítek `Circle`). */
export function dotsPath(pts: readonly GlyphDot[], r: number): string {
  const f = (n: number) => Math.round(n * 100) / 100;
  return pts.map((p) => `M${f(p.x - r)} ${f(p.y)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0`).join('');
}
