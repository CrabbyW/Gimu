import { BONES, DOT, GROUND_Y, HEAD_R, JOINTS, SILHOUETTES, type Joint, type Pose, type Pt } from '@/logic/silhouettePoses';
import type { SilhouetteId } from '@/types';

const clamp01 = (t: number) => (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Lineární interpolace dvou póz (t mimo 0–1 se ořízne, NaN = 0). */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const k = clamp01(t);
  const joints = {} as Record<Joint, Pt>;
  for (const j of JOINTS) joints[j] = lerpPt(a.joints[j], b.joints[j], k);
  return { head: lerpPt(a.head, b.head, k), joints };
}

/** Póza v čase t ∈ [0,1] po řetězci klíčových póz (0 = první, 1 = poslední), lineárně po úsecích.
 *  Smyčku tam a zpět řídí volající (motion); tady je jen jednosměrná mapa. */
export function poseAt(keys: readonly Pose[], t: number): Pose {
  const first = keys[0] as Pose;
  if (keys.length === 1) return first;
  const x = clamp01(t) * (keys.length - 1);
  const i = Math.min(Math.floor(x), keys.length - 2);
  return lerpPose(keys[i] as Pose, keys[i + 1] as Pose, x - i);
}

/** Počet teček na každé kosti — pevný pro siluetu (podle nejdelší varianty kosti), aby se tečky mezi
 *  pózami jen posouvaly, nikdy nepřibývaly. */
export function boneDotCounts(id: SilhouetteId): number[] {
  const { keys } = SILHOUETTES[id];
  return BONES.map(([a, b]) => {
    const len = Math.max(...keys.map((p) => Math.hypot(p.joints[b][0] - p.joints[a][0], p.joints[b][1] - p.joints[a][1])));
    return Math.max(2, Math.round(len / DOT.pitch) + 1);
  });
}

/** Hlava jako tečkový disk: střed + prstenec (12 teček ≈ rozteč DOT.pitch po obvodu). */
const HEAD_RING = 12;
const HEAD_RING_R = HEAD_R - DOT.r;

/** Tečky postavy pro pózu: kosti (kloub sdílený dvěma kostmi jen jednou) + hlava. Počet je pro siluetu konstantní. */
export function poseDots(pose: Pose, counts: readonly number[]): Pt[] {
  const out: Pt[] = [];
  const seen = new Set<Joint>();
  BONES.forEach(([a, b], bi) => {
    const n = counts[bi] ?? 2;
    for (let i = 0; i < n; i++) {
      if (i === 0 && seen.has(a)) continue;
      out.push(lerpPt(pose.joints[a], pose.joints[b], i / (n - 1)));
    }
    seen.add(a); seen.add(b);
  });
  // Trup ve 2 souběžných řadách (druhá řada 2·DOT.torsoW = jedna rozteč kolmo od páteře): naznačená šířka hrudníku a pánve.
  const [nx, ny] = pose.joints.neck; const [hx, hy] = pose.joints.hip;
  const len = Math.hypot(hx - nx, hy - ny) || 1;
  const ox = (-(hy - ny) / len) * DOT.torsoW * 2; const oy = ((hx - nx) / len) * DOT.torsoW * 2;
  const tn = counts[0] ?? 2;
  // Vnitřní body druhé řady (bez krajních, ty by kolidovaly s krkem/paží a kyčlí/nohou).
  for (let i = 1; i < tn - 1; i++) {
    const [x, y] = lerpPt(pose.joints.neck, pose.joints.hip, i / (tn - 1));
    out.push([x + ox, y + oy]);
  }
  out.push(pose.head);
  for (let i = 0; i < HEAD_RING; i++) {
    const ang = (i / HEAD_RING) * Math.PI * 2 - Math.PI / 2;
    out.push([pose.head[0] + Math.cos(ang) * HEAD_RING_R, pose.head[1] + Math.sin(ang) * HEAD_RING_R]);
  }
  return out;
}

/** Index středové tečky hlavy („oko“, kreslí se v akcentu `live`) v poli ze `silhouetteDots`: hlava je za kostmi, za ní prstenec. */
export const headDotIndex = (dotCount: number): number => dotCount - 1 - HEAD_RING;

/** Tečky statické opory (bradla…) s roztečí DOT.pitch. */
export function propDots(id: SilhouetteId): Pt[] {
  return (SILHOUETTES[id].props ?? []).flatMap(([a, b]) => {
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / DOT.pitch) + 1);
    return Array.from({ length: n }, (_, i) => lerpPt(a, b, i / (n - 1)));
  });
}

/** Tečky siluety v čase t (0 = první klíčová póza, 1 = poslední): opora + postava. */
export function silhouetteDots(id: SilhouetteId, t: number): Pt[] {
  return [...propDots(id), ...poseDots(poseAt(SILHOUETTES[id].keys, t), boneDotCounts(id))];
}

/** Výřez siluety: obal všech klíčových póz (s hlavou) + zem; minimální rozměr drží velikost teček
 *  u ležících póz v rozumných mezích. */
// Minimum výšky 44 (dřív 72): kompaktní pózy (crow, L-sit) se jinak v nízkém panelu (w320: 254×62 pt) scvrkly na ~30 pt.
const MIN_FRAME = { w: 140, h: 44 } as const;
export function poseFrame(id: SilhouetteId, pad = 8): { x: number; y: number; w: number; h: number } {
  const pts = SILHOUETTES[id].keys.flatMap((p) => [
    [p.head[0] - HEAD_R, p.head[1] - HEAD_R] as Pt, [p.head[0] + HEAD_R, p.head[1] + HEAD_R] as Pt, ...Object.values(p.joints),
  ]).concat((SILHOUETTES[id].props ?? []).flat());
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const w = Math.max(Math.max(...xs) - Math.min(...xs) + 2 * pad, MIN_FRAME.w);
  const bottom = GROUND_Y + 4;
  const h = Math.max(bottom - (Math.min(...ys) - pad), MIN_FRAME.h);
  return { x: cx - w / 2, y: bottom - h, w, h };
}
