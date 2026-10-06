// Život opičky v klidu (idle repertoár): čistý výběr akce a pauzy, bez Reactu a animací.
// Náhodnost je injektovaná (`rng` vracející [0, 1)), takže výběr jde deterministicky testovat (`mulberry32`).
// Přehrání řeší `components/mascot/` (useMascotIdle + reactionMotion), hodnoty jsou v `motion.mascotIdle`.

export type IdleActionId =
  | 'lookAround' | 'doubleBlink' | 'stretch' | 'sway' | 'headScratch' | 'joyHop' | 'lookPlate' | 'yawn';

export const IDLE_ACTIONS: readonly IdleActionId[] = [
  'lookAround', 'doubleBlink', 'stretch', 'sway', 'headScratch', 'joyHop', 'lookPlate', 'yawn',
];

/** Kde opička stojí: `map` = sedí na kotouči (smí se podívat dolů na něj), `podium` = vítěz ligy (radostnější). */
export type IdleContext = 'default' | 'map' | 'podium';

export type Rng = () => number;

export interface IdleConfig {
  pause: { minMs: number; maxMs: number };
  podiumPause: { minMs: number; maxMs: number };
  busyMs: number;
  yawnAfterMs: number;
  weights: Record<IdleActionId, number>;
  podiumWeights: Partial<Record<IdleActionId, number>>;
  yawnWeight: number;
}

/** Pauza před další idle akcí (rovnoměrně v rozsahu kontextu). */
export function nextIdlePause(rng: Rng, context: IdleContext, cfg: IdleConfig): number {
  const p = context === 'podium' ? cfg.podiumPause : cfg.pause;
  return Math.round(p.minMs + rng() * (p.maxMs - p.minMs));
}

/** Váhy akcí pro kontext: kotouč jen na mapě, zívnutí jen po delší nečinnosti, poslední akce se neopakuje. */
export function idleWeights(
  context: IdleContext, cfg: IdleConfig, last: IdleActionId | null, sinceInteractionMs: number | null,
): Record<IdleActionId, number> {
  const w = { ...cfg.weights, ...(context === 'podium' ? cfg.podiumWeights : {}) };
  if (context !== 'map') w.lookPlate = 0;
  w.yawn = sinceInteractionMs != null && sinceInteractionMs >= cfg.yawnAfterMs ? cfg.yawnWeight : 0;
  if (last) w[last] = 0;
  return w;
}

/** Vážený výběr akce. Když jsou všechny váhy nulové, vrátí null (nic se nehraje). */
export function pickIdleAction(
  rng: Rng, context: IdleContext, cfg: IdleConfig, last: IdleActionId | null = null, sinceInteractionMs: number | null = null,
): IdleActionId | null {
  const w = idleWeights(context, cfg, last, sinceInteractionMs);
  const total = IDLE_ACTIONS.reduce((s, id) => s + Math.max(0, w[id]), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const id of IDLE_ACTIONS) {
    const x = Math.max(0, w[id]);
    if (r < x) return id;
    r -= x;
  }
  return null;
}

/**
 * Smí teď hrát idle akce? Jen zapnutá, na zaostřené obrazovce, bez omezení pohybu, když opička nespí
 * a od začátku poslední reakce uběhlo aspoň `busyMs` (reakce má vždy přednost).
 */
export function canIdle(s: {
  enabled: boolean; focused: boolean; reduced: boolean; sleeping: boolean; now: number; reactionAt: number; busyMs: number;
}): boolean {
  return s.enabled && s.focused && !s.reduced && !s.sleeping && s.now - s.reactionAt >= s.busyMs;
}

/** Za kolik ms skončí blokace reakcí (0 = hned). */
export const busyLeft = (now: number, reactionAt: number, busyMs: number) => Math.max(0, reactionAt + busyMs - now);

/** Dlouhé roztočení kotouče (součet úhlu v rad během `spinFollow`) = zatočí se jí hlava. */
export const isLongSpin = (travelRad: number, thresholdRad: number) => travelRad >= thresholdRad;
