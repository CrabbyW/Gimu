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

/**
 * Rekvizity póz (`PoseProps.tsx`) ve viewBoxu 200: tečky stejné velikosti jako hrazda a Zz, střed kruhů
 * = střed hlavy samotné (pózy `figure: 'head'`), hruď = 18 pt rekvizita na trupu 52 pt.
 */
export const PROP = {
  dot: 2.4, step: 7, faceStroke: 2.6, halo: 1.4, liveDot: 5, arrow: 6,
  center: 100, ring: 76, ringDot: 5, avatar: 84,
  hourglass: { x: 162, top: 118, bottom: 170, half: 12 },
  flame: {
    x: 160, y: 156, liveDy: 12,
    outline: [[0, -30], [6, -20], [14, -10], [17, 2], [14, 14], [6, 20], [-6, 20], [-14, 14], [-17, 2], [-13, -8], [-6, -4], [-4, -16], [0, -30]] as const,
  },
  stairs: [[44, 186, 152], [124, 168, 72], [152, 150, 44]] as const,
  stairH: 12, stairRx: 3,
  ledge: { x: 30, y: 146, w: 140, h: 12, dot: 5, dotGap: 16 },
  triangle: { w: 58, h: 50, dy: 30 },
  wifi: { dx: 48, dy: 50, arcs: [10, 19, 28], slash: 18 },
  box: { s: 32, y: 164 },
  loupe: { small: 12, big: 22, ring: 4, handle: 6 },
  chest: 16,
  bust: { cy: 140, rx: 50, ry: 40 },
  // ——— Repertoár (2026-10-13) ———
  /** Činka: tyč přes ruce (přesah za dlaně), kotouče = sloupce teček (vnitřní vyšší, vnější „nacvakne“). */
  barbell: { overhang: 34, lift: 5, inner: { dx: 22, h: 30 }, outer: { dx: 30, h: 22 }, col: 4 },
  /** Ručník přes levé rameno (2 sloupce teček na srsti), lahev v levé ruce, kapky potu u levého spánku. */
  towel: { x: 82, top: 102, bottom: 140, gap: 5 },
  bottle: { w: 12, h: 26, neck: 5 },
  sweat: [[38, 38], [30, 50]] as const,
  /** Čelenka (dvě řady teček přes temeno v souřadnicích hlavy) a ručník kolem krku (dva pruhy po hrudi). */
  headband: { y: 37, rows: 2, rowGap: 5, step: 5, tail: [[136, 31], [142, 26], [146, 33]] as const },
  neckTowel: { dx: 11, top: 100, bottom: 134, gap: 5 },
  /** Hodinky na zápěstí: světlý ciferník na srsti, živá tečka = ručička (jediná červená pózy). */
  watch: { r: 10, strap: 5 },
  /** Lano: dvě šikmé smyčky přes trup (elipsy z teček) a volný konec k zemi. */
  tangle: { loops: [[100, 120, 36, 7, -10], [100, 140, 34, 7, 12]] as const, tail: [[132, 146], [148, 166], [140, 186], [160, 192]] as const },
  /** Obličej v souřadnicích hlavy: obloučky smíchu nad zavřenýma očima, otevřená pusa; zatnutí = obočí + zuby. */
  laugh: { arcH: 5, mouth: { cy: 86, w: 14, h: 9 } },
  clench: { brow: { dy: -12, len: 9, slant: 3 }, teeth: { cy: 88, w: 20, h: 7 } },
  /** Kotouč pod sedem: horní plocha (elipsa teček) a čelo kotouče (pevná hmota). */
  seatPlate: { cy: 154, rx: 52, ry: 9, h: 10, dots: 26 },
  /** Tečky směru za ukazujícím prstem (zmenšují se). */
  pointDots: { gap: 9, n: 3 },
  /** Otevřená krabice před tělem: čtverec z teček a dvě odklopené chlopně. */
  openBox: { w: 64, y: 150, h: 40, flap: 16 },
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
