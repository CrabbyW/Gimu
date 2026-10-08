export type PathId = 'power' | 'bodyControl' | 'strength';
export type PlateKg = 5 | 10 | 15 | 20 | 25;
export type SilhouetteId =
  | 'plank' | 'sidePlank' | 'pushup' | 'squat' | 'lunge' | 'hollow' | 'superman'
  | 'handstandWall' | 'lsit' | 'dip' | 'pullup' | 'hang' | 'bridge' | 'crow' | 'jump';

export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'hold';
  /** Opakování, nebo sekundy výdrže. */
  amount: number;
  description: string;
  silhouette: SilhouetteId;
  /** Náročný cvik (rovnováha, váha na rukou/zápěstích): v lekci bezpečnostní poznámka (elite fáze 5). */
  caution?: boolean;
}

export interface Lesson {
  id: string;
  pathId: PathId;
  section: number;
  /** Pořadí v sekci od 1, boss je poslední. */
  order: number;
  title: string;
  plateKg: PlateKg;
  exerciseIds: string[];
  isBoss: boolean;
}

export interface PathMeta { id: PathId; name: string; tagline: string; sections: { index: number; title: string }[] }
