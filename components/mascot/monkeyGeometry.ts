import { limbEnd, type LimbPose, type MascotPose } from '@/logic/mascotPoses';

/**
 * Geometrie opice v2 ve viewBoxu 200×200 (reference `old files and designs/opice-v2-pozy.png`):
 * velká kulatá hlava, velké kulaté uši, obličej ve tvaru srdce, krátké zaoblené tělo, tyčinkové končetiny
 * bez prstů (tah s kulatým koncem). Každá končetina = dva segmenty s pivotem (rameno/kyčel → loket/koleno).
 */
export const V2 = {
  head: { cx: 100, cy: 66, r: 42 },
  ears: { dx: 42, dy: -4, r: 18 },
  /** Krk: pivot hlavy (náklon pózy i reakcí). */
  neck: { x: 100, y: 104 },
  /** Srdce: dva laloky nahoře, špička dole. */
  face: 'M100 55 C93 41 67 41 66 62 C65 81 87 95 100 104 C113 95 135 81 134 62 C133 41 107 41 100 55 Z',
  eyes: { dx: 12, cy: 69, rx: 5, ry: 7 },
  torso: { x: 74, y: 100, w: 52, h: 52, rx: 24 },
  /** Pivot těla (rotace pózy): střed kyčlí. */
  hip: { x: 100, y: 146 },
  shoulder: { dx: 20, y: 114 },
  arm: { upper: 18, lower: 18, w: 15 },
  hipJoint: { dx: 12, y: 144 },
  leg: { upper: 16, lower: 16, w: 18 },
} as const;

/** Oči podle pózy: výška elipsy (zavřené = tenká linka, přivřené = nižší a níž). */
export const EYE_RY = { open: V2.eyes.ry, half: 3.2, closed: 1 } as const;
export const EYE_DROP = { open: 0, half: 2.4, closed: 2.6 } as const;

/** Kotva sezení: spodní hrana trupu (na mapě leží na horní hraně kotouče, nohy visí přes čelo). */
export const SEAT_Y = V2.torso.y + V2.torso.h;

type Side = -1 | 1;
/** Lomená čára končetiny (pivot → kloub → konec) v souřadnicích těla. */
export function limbPath(px: number, py: number, upper: number, lower: number, pose: LimbPose, side: Side): string {
  const j = limbEnd(px, py, upper, pose.upper, side);
  const e = limbEnd(j.x, j.y, lower, pose.upper + pose.lower, side);
  const f = (n: number) => Math.round(n * 10) / 10;
  return `M${f(px)} ${f(py)} L${f(j.x)} ${f(j.y)} L${f(e.x)} ${f(e.y)}`;
}

export const armPath = (pose: MascotPose, side: Side) =>
  limbPath(V2.hip.x + side * V2.shoulder.dx, V2.shoulder.y, V2.arm.upper * pose.reach, V2.arm.lower * pose.reach, side < 0 ? pose.armL : pose.armR, side);

export const legPath = (pose: MascotPose, side: Side) =>
  limbPath(V2.hip.x + side * V2.hipJoint.dx, V2.hipJoint.y, V2.leg.upper, V2.leg.lower, side < 0 ? pose.legL : pose.legR, side);

/** Konec paže ve světových souřadnicích viewBoxu (pro hrazdu nad rukama). */
export function handWorld(pose: MascotPose, side: Side): { x: number; y: number } {
  const p = side < 0 ? pose.armL : pose.armR;
  const s = { x: V2.hip.x + side * V2.shoulder.dx, y: V2.shoulder.y };
  const j = limbEnd(s.x, s.y, V2.arm.upper * pose.reach, p.upper, side);
  const e = limbEnd(j.x, j.y, V2.arm.lower * pose.reach, p.upper + p.lower, side);
  const rad = (pose.body * Math.PI) / 180;
  const dx = e.x - V2.hip.x, dy = e.y - V2.hip.y;
  return { x: V2.hip.x + dx * Math.cos(rad) - dy * Math.sin(rad) + pose.dx, y: V2.hip.y + dx * Math.sin(rad) + dy * Math.cos(rad) + pose.dy };
}
