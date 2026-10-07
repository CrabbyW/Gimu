import type { DotPlateState } from '@/components/dots/DotPlate';

/**
 * Let kotouče mapa → lekce (elite fáze 1, spec §2.3). Malý store mimo React: mapa změří kotouč a `launch`,
 * lekce změří řadu teček a `land`, overlay `PlateFlight` (nad Stackem) let nakreslí a na konci `clear`.
 * Poslední cíl (`lastRect`) si přečte oslava, aby tečky slétaly z místa, kam kotouč zmizel.
 * Pravidlo: neplatný rozměr (0, NaN, selhání measure) let přeskočí, nic nepadá a navigace jde dál.
 */
export interface Rect { x: number; y: number; width: number; height: number }
export interface Flight {
  /** Roste s každým startem: overlay podle něj pozná nový let. */
  id: number;
  from: Rect;
  kg: number;
  state: DotPlateState;
  /** null = lekce ještě cíl nezměřila (kotouč visí na místě). */
  to: Rect | null;
}

type Listener = () => void;
let flight: Flight | null = null;
let last: Rect | null = null;
let seq = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export const isValidRect = (r: Rect | null | undefined): r is Rect =>
  r != null && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.width > 0 && r.height > 0;

/** Start letu. Neplatný `from` = let se přeskočí (vrací false), předchozí let se zruší. */
export function launch(p: { from: Rect | null; kg: number; state: DotPlateState }): boolean {
  last = null;
  if (!isValidRect(p.from)) { clear(); return false; }
  flight = { id: ++seq, from: p.from, kg: p.kg, state: p.state, to: null };
  emit();
  return true;
}

/** Cíl letu (řada teček lekce). Bez běžícího letu nebo s neplatným cílem se nic nekreslí (let skončí). */
export function land(to: Rect | null): boolean {
  if (!flight || flight.to) return false;
  if (!isValidRect(to)) { clear(); return false; }
  flight = { ...flight, to };
  last = to;
  emit();
  return true;
}

/** Konec letu (overlay po doletu, nebo zrušení). `lastRect` zůstává pro oslavu. */
export function clear(): void {
  if (!flight) return;
  flight = null;
  emit();
}

export const getFlight = (): Flight | null => flight;
/** Kam kotouč naposledy dolétl (okno), pro slétání teček v oslavě; jednorázové. */
export function takeLastRect(): Rect | null { const r = last; last = null; return r; }
export function subscribe(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; }

/** Kotouče mapy podle id lekce (PlateNode je registruje), aby šly změřit při startu lekce. */
interface Measurable { measureInWindow(cb: (x: number, y: number, w: number, h: number) => void): void }
interface PlateEntry { view: Measurable; kg: number; state: DotPlateState }
const plates = new Map<string, PlateEntry>();
export function registerPlate(id: string, view: Measurable | null, kg: number, state: DotPlateState): () => void {
  const entry = view ? { view, kg, state } : null;
  if (entry) plates.set(id, entry);
  return () => { if (entry && plates.get(id) === entry) plates.delete(id); };
}

/** Změří view v okně; selhání, nula nebo nepřijde-li odpověď do `maxMs` → null. Nikdy nevyhodí. */
export function measureRect(view: Measurable | null | undefined, maxMs: number): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!view) { resolve(null); return; }
    let done = false;
    const finish = (r: Rect | null) => { if (!done) { done = true; resolve(isValidRect(r) ? r : null); } };
    const t = setTimeout(() => finish(null), maxMs);
    try {
      view.measureInWindow((x, y, width, height) => { clearTimeout(t); finish({ x, y, width, height }); });
    } catch {
      clearTimeout(t);
      finish(null);
    }
  });
}

/** Změří registrovaný kotouč lekce `id` a odstartuje let. Neznámý kotouč nebo selhání měření = bez letu (false). */
export async function launchFromPlate(id: string, maxMs: number): Promise<boolean> {
  const e = plates.get(id);
  if (!e) { launch({ from: null, kg: 0, state: 'current' }); return false; }
  return launch({ from: await measureRect(e.view, maxMs), kg: e.kg, state: e.state });
}

/** Dvojí ťuknutí = jedna navigace: první start zamkne na `ms` (nebo do `endStart`, návrat na mapu). */
let lockUntil = 0;
export function tryBeginStart(now = Date.now(), ms = 1500): boolean {
  if (now < lockUntil) return false;
  lockUntil = now + ms;
  return true;
}
export function endStart(): void { lockUntil = 0; }

/** Jen pro testy. */
export function __reset(): void { flight = null; last = null; lockUntil = 0; plates.clear(); listeners.clear(); }
