import type { MascotStage } from '@/types';

/** Paže: x,y = rameno (bod otáčení), w×h obdélník paže, angle ve stupních, + = ven od těla. */
export interface Limb { x: number; y: number; w: number; h: number; angle: number }

/** Geometrie jedné stage ve viewBoxu 200×200 (spec §8). */
export interface StageGeometry {
  /** Obličej (oči, pusa, nos) se kreslí jako skupina stage 1 se scale = r / 54. */
  head: { cx: number; cy: number; r: number };
  /** Offset uší od středu hlavy, vnitřek ucha má r/2. */
  ears: { dx: number; dy: number; r: number };
  torso: { x: number; y: number; w: number; h: number; rx: number };
  /** Jen stage 3. */
  shoulders: { x: number; y: number; w: number; h: number; rx: number } | null;
  armL: Limb;
  armR: Limb;
  legs: { y: number; dx: number; r: number };
}

export const STAGE_GEOMETRY: Record<MascotStage, StageGeometry> = {
  1: { // velká hlava, malé tělo
    head: { cx: 100, cy: 80, r: 54 }, ears: { dx: 54, dy: -2, r: 18 },
    torso: { x: 72, y: 122, w: 56, h: 52, rx: 26 }, shoulders: null,
    armL: { x: 74, y: 128, w: 14, h: 40, angle: 18 }, armR: { x: 126, y: 128, w: 14, h: 40, angle: 18 },
    legs: { y: 176, dx: 18, r: 12 },
  },
  2: { // vyvážené proporce
    head: { cx: 100, cy: 72, r: 44 }, ears: { dx: 44, dy: -2, r: 15 },
    torso: { x: 66, y: 108, w: 68, h: 64, rx: 28 }, shoulders: null,
    armL: { x: 70, y: 114, w: 16, h: 50, angle: 14 }, armR: { x: 130, y: 114, w: 16, h: 50, angle: 14 },
    legs: { y: 178, dx: 16, r: 14 },
  },
  3: { // široká ramena, výrazné paže
    head: { cx: 100, cy: 64, r: 40 }, ears: { dx: 40, dy: -2, r: 14 },
    torso: { x: 70, y: 112, w: 60, h: 60, rx: 24 }, shoulders: { x: 50, y: 96, w: 100, h: 34, rx: 17 },
    armL: { x: 54, y: 112, w: 22, h: 56, angle: 10 }, armR: { x: 146, y: 112, w: 22, h: 56, angle: 10 },
    legs: { y: 178, dx: 17, r: 15 },
  },
};
